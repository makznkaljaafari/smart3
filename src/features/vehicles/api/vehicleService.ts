
import { supabase } from '../../../lib/supabaseClient';
import { Vehicle, VINScanResult, MaintenancePrediction } from '../types';
import { useZustandStore } from '../../../store/useStore';
import { callAIProxy, callAIProxyStructured, cleanJsonString } from '../../../lib/aiClient';

const VEHICLE_COLUMNS = `
  id, company_id, vin, plate_number, make, model, year, color, engine_size, current_mileage, notes, 
  customer_id, customers(name), created_at, updated_at
`;

export const vehicleService = {
  async getVehicles(search = '') {
    const companyId = useZustandStore.getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    let query = supabase
      .from('vehicles')
      .select(VEHICLE_COLUMNS)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`vin.ilike.%${search}%,plate_number.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) return { data: [], error };

    const mappedData: Vehicle[] = (data || []).map((v: any) => ({
      id: v.id,
      company_id: v.company_id,
      vin: v.vin,
      plateNumber: v.plate_number,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      engineSize: v.engine_size,
      currentMileage: v.current_mileage,
      notes: v.notes,
      customerId: v.customer_id,
      customerName: v.customers?.name,
      createdAt: v.created_at,
      updatedAt: v.updated_at
    }));

    return { data: mappedData, error: null };
  },

  async getVehiclesByCustomerId(customerId: string) {
    const companyId = useZustandStore.getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    const { data, error } = await supabase
      .from('vehicles')
      .select(VEHICLE_COLUMNS)
      .eq('company_id', companyId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error };

    const mappedData: Vehicle[] = (data || []).map((v: any) => ({
      id: v.id,
      company_id: v.company_id,
      vin: v.vin,
      plateNumber: v.plate_number,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      engineSize: v.engine_size,
      currentMileage: v.current_mileage,
      notes: v.notes,
      customerId: v.customer_id,
      customerName: v.customers?.name,
      createdAt: v.created_at,
      updatedAt: v.updated_at
    }));

    return { data: mappedData, error: null };
  },

  async saveVehicle(vehicleData: Partial<Vehicle>, isNew: boolean) {
    const companyId = useZustandStore.getState().currentCompany?.id;
    if (!companyId) return { data: null, error: new Error("No active company") };

    const dataToSave = { ...vehicleData, company_id: companyId };
    const payload = {
        company_id: companyId,
        vin: dataToSave.vin,
        plate_number: dataToSave.plateNumber,
        make: dataToSave.make,
        model: dataToSave.model,
        year: dataToSave.year,
        color: dataToSave.color,
        engine_size: dataToSave.engineSize,
        current_mileage: dataToSave.currentMileage,
        notes: dataToSave.notes,
        customer_id: dataToSave.customerId || null
    };

    const query = isNew
      ? supabase.from('vehicles').insert(payload)
      : supabase.from('vehicles').update(payload).eq('id', vehicleData.id!);

    return await query.select().single();
  },

  async deleteVehicle(id: string) {
    return await supabase.from('vehicles').delete().eq('id', id);
  },

  async extractDataFromImage(base64Image: string, mimeType: string): Promise<VINScanResult | null> {
    try {
        const prompt = `
          Analyze this image. It contains a car's VIN (Vehicle Identification Number) usually on a dashboard, door sticker, or registration card.
          Extract the following details into a pure JSON object (no markdown):
          {
            "vin": "The 17-character VIN code (ensure it contains no I, O, or Q)",
            "make": "Car Make (e.g. Toyota)",
            "model": "Car Model (e.g. Camry)",
            "year": 2020 (Number, if visible),
            "color": "Color (if visible)"
          }
          If specific fields aren't found, leave them null.
        `;

        // Use structured call for images
        const text = await callAIProxyStructured(
            [
                {
                    parts: [
                        { inlineData: { data: base64Image, mimeType: mimeType } },
                        { text: prompt }
                    ]
                }
            ],
            { responseMimeType: 'application/json' }
        );

        if (!text) return null;
        return JSON.parse(cleanJsonString(text)) as VINScanResult;
    } catch (e) {
        console.error("AI VIN Scan failed:", e);
        return null;
    }
  },

  async predictMaintenance(vehicle: Vehicle, lang: 'ar' | 'en'): Promise<MaintenancePrediction[] | null> {
      try {
          const prompt = `
            You are an expert automotive mechanic AI.
            Analyze this vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} with ${vehicle.currentMileage || 'unknown'} KM mileage.
            
            Provide a list of recommended maintenance tasks based on the mileage and age.
            If mileage is unknown, suggest general maintenance for a car of this age.
            
            Response Language: ${lang === 'ar' ? 'Arabic' : 'English'}
            
            Return a valid JSON array of objects with this structure:
            [
              {
                "task": "Name of task (e.g. Oil Change)",
                "description": "Why it is needed",
                "urgency": "high" | "medium" | "low",
                "estimatedCostRange": "Estimated cost in USD (e.g. $50-$100)",
                "recommendedAction": "What to do"
              }
            ]
          `;

          const text = await callAIProxy(prompt, { responseMimeType: 'application/json' });

          if (!text) return null;
          return JSON.parse(cleanJsonString(text)) as MaintenancePrediction[];
      } catch (e) {
          console.error("AI Maintenance Prediction failed:", e);
          return null;
      }
  },

  async chatWithVehicle(vehicle: Vehicle, message: string, history: { role: 'user' | 'model', content: string }[], lang: 'ar' | 'en') {
      const context = `
        Vehicle Context:
        - Make/Model: ${vehicle.make} ${vehicle.model} (${vehicle.year})
        - VIN: ${vehicle.vin}
        - Mileage: ${vehicle.currentMileage} km
        - Engine: ${vehicle.engineSize}
        - Notes: ${vehicle.notes}
        
        You are a specialized Vehicle Assistant. Answer questions about THIS specific vehicle.
        If asked about maintenance, refer to general knowledge for this make/model/mileage.
        Keep answers concise and helpful.
        Language: ${lang === 'ar' ? 'Arabic' : 'English'}
      `;

      const chatHistoryStr = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
      
      const prompt = `
        ${context}
        
        Chat History:
        ${chatHistoryStr}
        
        User: ${message}
        Assistant:
      `;

      return await callAIProxy(prompt);
  }
};
