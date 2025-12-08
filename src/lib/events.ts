
import { AppEvent, SettingsState, LangCode } from '../types';
import { translations } from './i18n';

const subscribers = new Set<(e: AppEvent) => void>();

/**
 * A simple in-memory event bus for handling application-wide events.
 * This allows decoupled communication between different parts of the application.
 * @example
 * // Publishing an event
 * eventBus.publish({ type: 'DEBT_CREATED', ... });
 *
 * // Subscribing to events in a React component
 * useEffect(() => {
 *   const unsubscribe = eventBus.subscribe(event => console.log(event));
 *   return unsubscribe;
 * }, []);
 */
export const eventBus = {
  /**
   * Publishes an event to all subscribed listeners.
   * @param e The application event to publish.
   */
  publish: (e: AppEvent) => subscribers.forEach((s) => s(e)),
  /**
   * Subscribes a listener function to application events.
   * @param fn The callback function to execute when an event is published.
   * @returns A function to unsubscribe the listener.
   */
  subscribe: (fn: (e: AppEvent) => void) => {
    subscribers.add(fn);
    // The cleanup function for useEffect must not return a value.
    // Set.delete() returns a boolean, so we wrap it in a block to ensure undefined is returned.
    return () => {
      subscribers.delete(fn);
    };
  }
};

async function postJSON(url: string, body: any, headers?: Record<string, string>) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers || {}) },
      body: JSON.stringify(body)
    });
    return { ok: res.ok, status: res.status, text: await res.text() };
  } catch (e: any) {
    return { ok: false, status: 0, text: e?.message || 'network error' };
  }
}

function formatEventMessage(e: AppEvent, lang: LangCode) {
  const isAr = lang === 'ar';
  switch (e.type) {
    case 'DEBT_CREATED':
      return isAr
        ? `تم إنشاء دين على ${e.payload.customer} بمبلغ ${e.payload.amount} ${e.payload.currency} يستحق في ${e.payload.dueDate}`
        : `New debt for ${e.payload.customer}: ${e.payload.amount} ${e.payload.currency}, due ${e.payload.dueDate}`;
    case 'DEBT_SETTLED':
      return isAr
        ? `تم سداد دين بقيمة ${e.payload.amount} ${e.payload.currency} من ${e.payload.customer}`
        : `Debt settled: ${e.payload.amount} ${e.payload.currency} by ${e.payload.customer}`;
    case 'EXPENSE_CREATED':
      return isAr
        ? `تم تسجيل مصروف (${e.payload.category}) بقيمة ${e.payload.amount} ${e.payload.currency}`
        : `Expense recorded (${e.payload.category}) of ${e.payload.amount} ${e.payload.currency}`;
    case 'INCOME_CREATED':
      return isAr
        ? `تم تسجيل إيراد (${e.payload.category}) بقيمة ${e.payload.amount} ${e.payload.currency}`
        : `Income recorded (${e.payload.category}) of ${e.payload.amount} ${e.payload.currency}`;
    case 'NOTE_CREATED':
      return isAr ? `تمت إضافة ملاحظة جديدة` : `New note added`;
    case 'CUSTOMER_CREATED':
      return isAr ? `تم إضافة عميل: ${e.payload.name}` : `Customer added: ${e.payload.name}`;
    case 'BACKUP_CREATED':
      return isAr ? `تم إنشاء نسخة احتياطية` : `Backup created`;
    case 'BACKUP_RESTORED':
      return isAr ? `تم استعادة النسخة الاحتياطية` : `Backup restored`;
    case 'SCHEDULED_REPORT_READY':
        const reportTitle = translations[lang][e.payload.reportType] || e.payload.reportType;
        return isAr
            ? `📄 تقريرك المجدول "${reportTitle}" جاهز.`
            : `📄 Your scheduled report "${reportTitle}" is ready.`;
    case 'SMART_ALERT':
      return isAr
        ? `🚨 تنبيه ذكي: ${e.payload.message}`
        : `🚨 Smart Alert: ${e.payload.message}`;
    case 'DEBT_REMINDER_SEND':
        return isAr
            ? `👋 تذكير ودي، ${e.payload.customerName}. لديكم مبلغ مستحق قدره ${e.payload.remainingAmount} ${e.payload.currency} خاص بالفاتورة رقم ${e.payload.invoiceNumber} والذي كان من المفترض دفعه بتاريخ ${e.payload.dueDate}. يرجى المبادرة بالسداد.`
            : `👋 Friendly reminder, ${e.payload.customerName}. This is a notice for an outstanding payment of ${e.payload.remainingAmount} ${e.payload.currency} for invoice #${e.payload.invoiceNumber}, which was due on ${e.payload.dueDate}. Please arrange for payment.`;
    case 'LOW_STOCK_ALERT':
        let baseMsg = isAr
            ? `📉 تنبيه انخفاض المخزون: مستوى مخزون المنتج "${e.payload.productName}" (${e.payload.quantity}) وصل إلى نقطة إعادة الطلب.`
            : `📉 Low Stock Alert: Stock for "${e.payload.productName}" (${e.payload.quantity}) has reached its reorder point.`;
        
        if (e.payload.prediction) {
            const predictionMsg = isAr
                ? ` بناءً على معدل المبيعات، من المتوقع نفاد الكمية خلال ${e.payload.prediction}.`
                : ` Based on sales velocity, stock is predicted to run out in ${e.payload.prediction}.`;
            return baseMsg + predictionMsg;
        }
        return baseMsg;
    case 'SALES_INVOICE_SEND':
      return isAr
        ? `🧾 فاتورة مبيعات #${e.payload.invoiceNumber} للعميل ${e.payload.customerName} بمبلغ إجمالي ${e.payload.total} ${e.payload.currency}.`
        : `🧾 Sales Invoice #${e.payload.invoiceNumber} for ${e.payload.customerName} with a total of ${e.payload.total} ${e.payload.currency}.`;
    case 'PURCHASE_INVOICE_SEND':
      return isAr
        ? `🧾 فاتورة مشتريات #${e.payload.invoiceNumber} من المورد ${e.payload.supplierName} بمبلغ إجمالي ${e.payload.total} ${e.payload.currency}.`
        : `🧾 Purchase Invoice #${e.payload.invoiceNumber} from ${e.payload.supplierName} with a total of ${e.payload.total} ${e.payload.currency}.`;
    case 'PAYMENT_RECEIPT_SEND':
      return isAr
        ? `✅ إيصال دفع: تم استلام دفعة بقيمة ${e.payload.amount} ${e.payload.currency} من ${e.payload.recipientName} بتاريخ ${e.payload.date}.`
        : `✅ Payment Receipt: A payment of ${e.payload.amount} ${e.payload.currency} was received from ${e.payload.recipientName} on ${e.payload.date}.`;
    case 'ACCOUNT_STATEMENT_SEND':
      return isAr
        ? `📄 كشف حساب لـ ${e.payload.recipientName}. الرصيد الحالي: ${e.payload.balance}.`
        : `📄 Account statement for ${e.payload.recipientName}. Current balance: ${e.payload.balance}.`;
    default:
      return isAr ? 'حدث' : 'Event';
  }
}

/**
 * Sends notifications for a given application event to all configured channels (e.g., WhatsApp, Telegram, Webhooks).
 * @param e The application event that triggered the notification.
 * @param settings The current application settings, which contain integration details.
 */
export async function notifyAll(e: AppEvent, settings: SettingsState) {
  const msg = formatEventMessage(e, e.lang);
  
  // 1. WhatsApp Integration
  if (settings.notifications.whatsapp && settings.integrations.whatsappWebhookUrl) {
    await postJSON(
      settings.integrations.whatsappWebhookUrl!,
      { message: msg, type: e.type, payload: e.payload },
      settings.integrations.whatsappApiKey ? { Authorization: `Bearer ${settings.integrations.whatsappApiKey}` } : undefined
    );
  }

  // 2. Telegram Integration
  if (settings.notifications.telegram && settings.integrations.telegramBotToken && settings.integrations.telegramChatId) {
    const tgUrl = `https://api.telegram.org/bot${settings.integrations.telegramBotToken}/sendMessage`;
    await postJSON(tgUrl, { chat_id: settings.integrations.telegramChatId, text: msg });
  }

  // 3. Email Integration
  if (settings.notifications.email && settings.integrations.smtp?.host && e.payload.recipientEmail) {
    console.log("SIMULATING EMAIL SEND:", {
        to: e.payload.recipientEmail,
        from: settings.integrations.smtp.from,
        subject: `Smart Finance AI Notification: ${e.type}`,
        body: msg,
    });
  }

  // 4. Custom Webhooks
  if (settings.integrations.webhooks && settings.integrations.webhooks.length > 0) {
      settings.integrations.webhooks.forEach(async (webhook) => {
          if (webhook.active && webhook.events.includes(e.type)) {
              // Prepare headers
              const headers: Record<string, string> = {};
              if (webhook.secret) {
                  headers['X-Webhook-Secret'] = webhook.secret;
              }
              if (webhook.headers) {
                  webhook.headers.forEach(h => {
                      headers[h.key] = h.value;
                  });
              }

              // Fire and forget
              postJSON(webhook.url, {
                  id: e.id,
                  type: e.type,
                  timestamp: e.at,
                  payload: e.payload,
                  message: msg
              }, headers).catch(err => console.error(`Webhook ${webhook.name} failed:`, err));
          }
      });
  }
}
