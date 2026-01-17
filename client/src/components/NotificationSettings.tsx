import { Bell, BellOff, Check } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    requestPermission,
    unsubscribe,
    scheduleDailyReminder,
  } = useNotifications();

  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [achievementsEnabled, setAchievementsEnabled] = useState(true);
  const [newSongsEnabled, setNewSongsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('19:00');

  useEffect(() => {
    // Load preferences from localStorage
    const prefs = localStorage.getItem('notification_preferences');
    if (prefs) {
      const parsed = JSON.parse(prefs);
      setDailyReminderEnabled(parsed.dailyReminder ?? false);
      setAchievementsEnabled(parsed.achievements ?? true);
      setNewSongsEnabled(parsed.newSongs ?? true);
      setReminderTime(parsed.reminderTime ?? '19:00');
    }
  }, []);

  useEffect(() => {
    // Save preferences to localStorage
    const prefs = {
      dailyReminder: dailyReminderEnabled,
      achievements: achievementsEnabled,
      newSongs: newSongsEnabled,
      reminderTime,
    };
    localStorage.setItem('notification_preferences', JSON.stringify(prefs));

    // Schedule daily reminder if enabled
    if (dailyReminderEnabled && permission === 'granted') {
      const [hour, minute] = reminderTime.split(':').map(Number);
      scheduleDailyReminder(hour, minute);
    }
  }, [dailyReminderEnabled, achievementsEnabled, newSongsEnabled, reminderTime, permission, scheduleDailyReminder]);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      setDailyReminderEnabled(true);
    }
  };

  const handleDisableNotifications = async () => {
    await unsubscribe();
    setDailyReminderEnabled(false);
  };

  if (!isSupported) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-slate-400">
          <BellOff className="w-5 h-5" />
          <div>
            <p className="font-medium">Notificações não suportadas</p>
            <p className="text-sm">Seu navegador não suporta notificações push</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-cyan-500 p-2 rounded-lg">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Notificações</h3>
            <p className="text-sm text-slate-400">
              {permission === 'granted' ? 'Ativadas' : 'Desativadas'}
            </p>
          </div>
        </div>

        {permission === 'granted' ? (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <Check className="w-4 h-4" />
            Ativo
          </div>
        ) : (
          <Button
            onClick={handleEnableNotifications}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
          >
            Ativar
          </Button>
        )}
      </div>

      {permission === 'granted' && (
        <>
          <div className="border-t border-slate-800 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="daily-reminder" className="text-white font-medium">
                  Lembrete Diário
                </Label>
                <p className="text-sm text-slate-400">
                  Receba um lembrete para praticar todos os dias
                </p>
              </div>
              <Switch
                id="daily-reminder"
                checked={dailyReminderEnabled}
                onCheckedChange={setDailyReminderEnabled}
              />
            </div>

            {dailyReminderEnabled && (
              <div className="ml-6 flex items-center gap-3">
                <Label htmlFor="reminder-time" className="text-slate-400 text-sm">
                  Horário:
                </Label>
                <input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm border border-slate-700 focus:border-purple-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="achievements" className="text-white font-medium">
                  Conquistas
                </Label>
                <p className="text-sm text-slate-400">
                  Notificações quando desbloquear conquistas
                </p>
              </div>
              <Switch
                id="achievements"
                checked={achievementsEnabled}
                onCheckedChange={setAchievementsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="new-songs" className="text-white font-medium">
                  Novas Músicas
                </Label>
                <p className="text-sm text-slate-400">
                  Notificações quando novas músicas forem adicionadas
                </p>
              </div>
              <Switch
                id="new-songs"
                checked={newSongsEnabled}
                onCheckedChange={setNewSongsEnabled}
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <Button
              onClick={handleDisableNotifications}
              variant="outline"
              size="sm"
              className="w-full text-red-400 border-red-400/20 hover:bg-red-400/10"
            >
              <BellOff className="w-4 h-4 mr-2" />
              Desativar Todas as Notificações
            </Button>
          </div>
        </>
      )}

      {permission === 'denied' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">
            <strong>Notificações bloqueadas.</strong> Para ativar, vá nas configurações do seu
            navegador e permita notificações para este site.
          </p>
        </div>
      )}
    </Card>
  );
}
