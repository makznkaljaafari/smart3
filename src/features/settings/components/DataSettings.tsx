
import React, { useState } from 'react';
import { SectionBox } from '../../../components/ui/SectionBox';
import { HoloButton } from '../../../components/ui/HoloButton';
import { LS_KEY, useZustandStore } from '../../../store/useStore';
import { Download, Upload, Trash2, AlertTriangle, UploadCloud, DownloadCloud, Loader } from 'lucide-react';
import { Toast, AppTheme } from '../../../types';

interface DataSettingsProps {
  t: Record<string, string>;
  theme: AppTheme;
}

export const DataSettings: React.FC<DataSettingsProps> = ({ t, theme }) => {
  const addToastAction = useZustandStore(state => state.addToast);
  const [driveStatus, setDriveStatus] = useState<'idle' | 'backing_up' | 'restoring'>('idle');

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    addToastAction({ message, type, duration: 5000 });
  };
  
  const handleExport = () => {
    const raw = localStorage.getItem(LS_KEY) || '{}';
    const blob = new Blob([raw], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    try {
      JSON.parse(txt); // Validate JSON
      localStorage.setItem(LS_KEY, txt);
      addToast(t.backupRestoredSuccess, 'success');
      setTimeout(() => window.location.reload(), 3000);
    } catch {
      addToast(t.invalidFileError, 'error');
    }
  };
  
  const handleDeleteAllData = () => {
    if (window.confirm(t.deleteAllDataConfirm)) {
      localStorage.removeItem(LS_KEY);
      addToast(t.dataDeletedSuccess, 'info');
      setTimeout(() => window.location.reload(), 3000);
    }
  };

  const handleGoogleDriveBackup = () => {
    setDriveStatus('backing_up');
    addToast(t.connectingToDrive, 'info');
    // Simulate API call to Google Drive
    setTimeout(() => {
        // In a real application, you would use the Google Drive API (gapi) here
        // to authenticate the user and upload the localStorage data as a file.
        // This is a placeholder for demonstration purposes.
        addToast(t.backupToDriveSuccess, 'success');
        setDriveStatus('idle');
    }, 2500);
  };
  
  const handleGoogleDriveRestore = () => {
    setDriveStatus('restoring');
    addToast(t.connectingToDrive, 'info');
     // Simulate API call to Google Drive
    setTimeout(() => {
        // In a real application, you would use the Google Picker API here
        // to let the user select a backup file from their Drive.
        addToast(t.restoreFromDriveInfo, 'info');
        setDriveStatus('idle');
    }, 2500);
  };

  const isDriveBusy = driveStatus !== 'idle';

  return (
    <>
      <SectionBox title={t.cloudBackup} theme={theme}>
        <p className={`text-xs mb-4 ${theme.startsWith('dark') ? 'text-gray-400' : 'text-slate-500'}`}>
          {t.cloudBackupDescription}
        </p>
        <div className="flex gap-3">
          <HoloButton
            variant="primary"
            onClick={handleGoogleDriveBackup}
            disabled={isDriveBusy}
            className={driveStatus === 'backing_up' ? 'animate-pulse' : ''}
          >
            {driveStatus === 'backing_up' 
                ? <Loader size={20} className="animate-spin"/> 
                : <UploadCloud size={20}/>}
            {driveStatus === 'backing_up' ? t.backingUp : t.backupToDrive}
          </HoloButton>
          <HoloButton
            variant="secondary"
            onClick={handleGoogleDriveRestore}
            disabled={isDriveBusy}
            className={driveStatus === 'restoring' ? 'animate-pulse' : ''}
          >
            {driveStatus === 'restoring' 
                ? <Loader size={20} className="animate-spin"/> 
                : <DownloadCloud size={20}/>}
            {driveStatus === 'restoring' ? t.restoring : t.restoreFromDrive}
          </HoloButton>
        </div>
      </SectionBox>
      <div className="mt-6">
        <SectionBox title={t.localBackup} theme={theme}>
            <p className={`text-xs mb-4 ${theme.startsWith('dark') ? 'text-gray-400' : 'text-slate-500'}`}>
                {t.localBackupDescription}
            </p>
            <div className="flex gap-3">
              <HoloButton icon={Download} variant="secondary" onClick={handleExport} disabled={isDriveBusy}>
                {t.export}
              </HoloButton>
              <HoloButton icon={Upload} variant="primary" className="relative" disabled={isDriveBusy}>
                <input
                  type="file"
                  accept="application/json"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleImport}
                  aria-label={t.import}
                  disabled={isDriveBusy}
                />
                {t.import}
              </HoloButton>
            </div>
        </SectionBox>
      </div>
      <div className="mt-6">
        <SectionBox title={t.dangerZone} theme={theme}>
          <div className={`p-4 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 
            ${theme.startsWith('dark') ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <div>
              <h4 className="font-bold flex items-center gap-2"><AlertTriangle /> {t.deleteAllData}</h4>
              <p className="text-xs mt-1">{t.deleteAllDataWarning}</p>
            </div>
            <HoloButton icon={Trash2} variant="danger" onClick={handleDeleteAllData} disabled={isDriveBusy}>
              {t.deleteAllData}
            </HoloButton>
          </div>
        </SectionBox>
      </div>
    </>
  );
};
