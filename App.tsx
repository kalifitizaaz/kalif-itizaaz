
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { getAppState, saveAppState } from './store';
import { AppState, DayLog, OptimismLevel } from './types';
import { MultiAnswerInput } from './components/MultiAnswerInput';
import { generateDailyInsight, generateAnnualReport } from './geminiService';

const MORNING_NOTIFY_TIME = "09:01";
const EVENING_NOTIFY_TIME = "22:01";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'insights' | 'settings'>('today');
  const [state, setState] = useState<AppState>(getAppState());
  const [step, setStep] = useState(0);
  const [showAnnual, setShowAnnual] = useState(false);
  const [annualReport, setAnnualReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const lastNotifiedRef = useRef<{ date: string; type: 'morning' | 'evening' | null }>({ date: '', type: null });

  const todayStr = new Date().toISOString().split('T')[0];
  const currentLog: DayLog = state.logs[todayStr] || {
    date: todayStr,
    morning: { intentions: [], successFactor: '', optimism: OptimismLevel.NEUTRAL, completed: false },
    evening: { actuals: [], unexpected: '', deepReflection: '', completed: false }
  };

  const updateLog = (updated: DayLog) => {
    const newState = { ...state, logs: { ...state.logs, [todayStr]: updated } };
    setState(newState);
    saveAppState(newState);
  };

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => Math.max(0, s - 1));

  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const isMorningTime = currentHours < 17;

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(setNotificationPermission);
      }
    }

    const checkNotifications = () => {
      if (!state.settings.notificationsEnabled || Notification.permission !== 'granted') return;

      const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
      
      // Morning notification logic
      if (currentTimeStr >= MORNING_NOTIFY_TIME && currentTimeStr < "12:00") {
        if (!currentLog.morning.completed && (lastNotifiedRef.current.date !== todayStr || lastNotifiedRef.current.type !== 'morning')) {
          new Notification("MIRROR", {
            body: "Your morning window has passed. Would you like to set your intentions now?",
            icon: "/favicon.ico"
          });
          lastNotifiedRef.current = { date: todayStr, type: 'morning' };
        }
      }
      
      // Evening notification logic
      if (currentTimeStr >= EVENING_NOTIFY_TIME) {
        if (!currentLog.evening.completed && (lastNotifiedRef.current.date !== todayStr || lastNotifiedRef.current.type !== 'evening')) {
          new Notification("MIRROR", {
            body: "The day is coming to a close. Take a moment to reflect on your journey.",
            icon: "/favicon.ico"
          });
          lastNotifiedRef.current = { date: todayStr, type: 'evening' };
        }
      }
    };

    const interval = setInterval(checkNotifications, 30000); 
    checkNotifications();
    return () => clearInterval(interval);
  }, [state.settings, currentLog, todayStr, currentHours, currentMinutes]);

  const triggerAnnualReport = async () => {
    const logs = Object.values(state.logs).filter(log => log.morning.completed || log.evening.completed);
    if (logs.length === 0) {
      alert("Mirror needs at least one day of history to begin the reveal.");
      return;
    }
    setIsGeneratingReport(true);
    setShowAnnual(true);
    const report = await generateAnnualReport(logs);
    setAnnualReport(report || "The reflection is still forming.");
    setIsGeneratingReport(false);
  };

  const renderTodayView = () => {
    if (isMorningTime && !currentLog.morning.completed) {
      return (
        <>
          {step === 0 && (
            <QuestionStep question="What do you want to do today?" sub="Morning Window: 05:00 - 09:00">
              <MultiAnswerInput 
                items={currentLog.morning.intentions.map(i => i.text)}
                onAdd={(text) => {
                  const updated = { ...currentLog };
                  updated.morning.intentions.push({ id: Math.random().toString(), text });
                  updateLog(updated);
                }}
                onRemove={(idx) => {
                  const updated = { ...currentLog };
                  updated.morning.intentions.splice(idx, 1);
                  updateLog(updated);
                }}
                placeholder="I want to..."
              />
              <NavButtons onNext={handleNext} nextEnabled={currentLog.morning.intentions.length > 0} />
            </QuestionStep>
          )}
          {step === 1 && (
            <QuestionStep question="What is the one thing that would make today successful?">
              <input
                type="text"
                value={currentLog.morning.successFactor}
                onChange={(e) => updateLog({ ...currentLog, morning: { ...currentLog.morning, successFactor: e.target.value } })}
                placeholder="A single core focus..."
                className="w-full max-w-lg bg-transparent border-b border-gray-700 py-3 text-2xl font-extralight text-center focus:outline-none focus:border-white transition-colors"
                autoFocus
              />
              <NavButtons onNext={async () => {
                updateLog({ ...currentLog, morning: { ...currentLog.morning, completed: true } });
                setStep(0);
              }} onBack={handlePrev} nextLabel="Finish Morning" />
            </QuestionStep>
          )}
        </>
      );
    } else if (!isMorningTime && !currentLog.evening.completed) {
      return (
        <>
          {step === 0 && (
            <QuestionStep question="What actually happened today?" sub="Evening Window: 19:00 - 22:00">
              <MultiAnswerInput 
                items={currentLog.evening.actuals}
                onAdd={(text) => {
                  const updated = { ...currentLog };
                  updated.evening.actuals.push(text);
                  updateLog(updated);
                }}
                onRemove={(idx) => {
                  const updated = { ...currentLog };
                  updated.evening.actuals.splice(idx, 1);
                  updateLog(updated);
                }}
                placeholder="I actually did..."
              />
              <NavButtons onNext={handleNext} nextEnabled={currentLog.evening.actuals.length > 0} />
            </QuestionStep>
          )}
          {step === 1 && (
            <QuestionStep question="Do you want to tell us more about your day, today?" sub="Optional narrative reflection.">
              <textarea
                className="w-full max-w-2xl h-64 bg-transparent border border-gray-800 rounded-xl p-6 text-xl focus:outline-none focus:border-gray-600 transition-colors custom-scrollbar"
                value={currentLog.evening.deepReflection}
                onChange={(e) => updateLog({ ...currentLog, evening: { ...currentLog.evening, deepReflection: e.target.value } })}
                placeholder="Journal your thoughts..."
              />
              <NavButtons 
                onNext={async () => {
                  const updated = { ...currentLog, evening: { ...currentLog.evening, completed: true } };
                  updated.aiInsight = await generateDailyInsight(updated);
                  updateLog(updated);
                  setStep(0);
                }} 
                onBack={handlePrev} 
                nextLabel="Finalize Reflection" 
              />
            </QuestionStep>
          )}
        </>
      );
    } else {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center fade-in space-y-6">
          <div className="text-4xl font-extralight tracking-widest text-gray-500 uppercase">
            {isMorningTime ? "Morning Reflection Set" : "Day Reflected"}
          </div>
          <p className="text-gray-600 max-w-sm font-light">
            Go live your life. Mirror will wait for you when the window opens again.
          </p>
          <button onClick={() => { updateLog({ ...currentLog, morning: { ...currentLog.morning, completed: false }, evening: { ...currentLog.evening, completed: false } }); setStep(0); }} className="text-[10px] uppercase tracking-widest border border-gray-800 px-6 py-2 rounded-full text-gray-500 hover:text-white transition-all">
            Edit Answers
          </button>
        </div>
      );
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'today' && renderTodayView()}
      {activeTab === 'history' && (
        <div className="flex-1 p-12 max-w-4xl mx-auto w-full fade-in overflow-y-auto custom-scrollbar">
          <h2 className="text-3xl font-extralight mb-12 tracking-widest uppercase">The Trail</h2>
          {Object.values(state.logs).sort((a,b) => b.date.localeCompare(a.date)).map(log => (
            <div key={log.date} className="mb-12 border-l border-gray-800 pl-8 relative">
              <div className="absolute -left-1.5 top-0 w-3 h-3 bg-gray-700 rounded-full"></div>
              <div className="text-xs tracking-widest text-gray-500 mb-4 uppercase font-mono">{log.date}</div>
              <div className="grid grid-cols-2 gap-8 mb-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] text-gray-600 uppercase tracking-widest">Intended</h4>
                  {log.morning.intentions.map(i => <p key={i.id} className="text-sm text-gray-400">{i.text}</p>)}
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] text-gray-600 uppercase tracking-widest">Realized</h4>
                  {log.evening.actuals.map((a, i) => <p key={i} className="text-sm text-gray-400">{a}</p>)}
                </div>
              </div>
              {log.aiInsight && <div className="p-4 bg-gray-900/30 rounded border border-gray-800 text-sm italic text-gray-500">"{log.aiInsight}"</div>}
            </div>
          ))}
        </div>
      )}
      {activeTab === 'insights' && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-12 fade-in">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-extralight uppercase tracking-widest">The Mirror's Edge</h2>
            <p className="text-gray-500 text-xs tracking-widest uppercase">Forensic insights into your patterns.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
             <div className="p-8 bg-gray-900/30 border border-gray-800 rounded-2xl space-y-6">
                <h3 className="text-sm uppercase tracking-widest text-gray-400">The Annual Reveal</h3>
                <p className="text-gray-500 text-sm font-light">A deep-narrative analysis of your entire recorded history.</p>
                <button onClick={triggerAnnualReport} className="text-xs uppercase tracking-widest bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-all">Start Reveal</button>
             </div>
             <div className="p-8 bg-gray-900/30 border border-gray-800 rounded-2xl flex flex-col justify-center items-center">
                <div className="text-5xl font-extralight text-gray-200 mb-2">{Object.keys(state.logs).length}</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-gray-600">Reflections Captured</div>
             </div>
          </div>
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="flex-1 p-12 max-w-xl mx-auto w-full space-y-12 fade-in">
           <h2 className="text-3xl font-extralight tracking-widest uppercase">Preferences</h2>
           <div className="space-y-6">
              <div className="p-6 bg-gray-900/40 border border-gray-800 rounded-xl space-y-4">
                <h3 className="text-xs uppercase tracking-widest text-gray-400">Fixed Windows</h3>
                <div className="flex justify-between text-sm text-gray-500 font-mono"><span>Morning</span><span>05:00 - 09:00</span></div>
                <div className="flex justify-between text-sm text-gray-500 font-mono"><span>Evening</span><span>19:00 - 22:00</span></div>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-gray-800">
                <div className="space-y-1">
                  <span className="text-gray-400 font-light">Notifications</span>
                  <p className="text-[10px] text-gray-600">Reminders at 09:01 and 22:01 if incomplete.</p>
                </div>
                <button onClick={() => { const s = { ...state, settings: { ...state.settings, notificationsEnabled: !state.settings.notificationsEnabled } }; setState(s); saveAppState(s); }} className={`w-12 h-6 rounded-full p-1 transition-all ${state.settings.notificationsEnabled ? 'bg-white' : 'bg-gray-800'}`}>
                  <div className={`w-4 h-4 rounded-full transition-all ${state.settings.notificationsEnabled ? 'translate-x-6 bg-black' : 'bg-gray-400'}`}></div>
                </button>
              </div>
              <button onClick={() => { localStorage.removeItem('mirror_app_state'); window.location.reload(); }} className="text-[10px] uppercase tracking-widest text-red-900 hover:text-red-500 transition-colors">Clear all local data</button>
           </div>
        </div>
      )}

      {showAnnual && (
        <div className="fixed inset-0 z-[100] bg-[#0c0c0c] p-12 overflow-y-auto custom-scrollbar flex flex-col items-center">
          <div className="max-w-3xl w-full space-y-12">
            <button onClick={() => setShowAnnual(false)} className="text-[10px] uppercase tracking-widest text-gray-600 hover:text-white transition-all">← Close Reveal</button>
            {isGeneratingReport ? (
              <div className="py-40 text-center space-y-8 animate-pulse">
                <div className="text-5xl font-extralight tracking-[0.4em] uppercase">Consulting the Mirror</div>
                <p className="text-gray-600 text-xs italic tracking-widest">Gathering your intentions and outcomes...</p>
              </div>
            ) : (
              <div className="fade-in pb-24 space-y-12">
                <h1 className="text-6xl font-extralight tracking-widest uppercase text-center">The Reveal</h1>
                <div className="prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-gray-300 font-light text-xl italic font-serif">
                  {annualReport}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

const QuestionStep: React.FC<{ question: string; sub?: string; children: React.ReactNode }> = ({ question, sub, children }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12 fade-in max-w-4xl mx-auto w-full">
    <div className="text-center space-y-4">
      <h2 className="text-5xl font-extralight tracking-tight text-gray-100">{question}</h2>
      {sub && <p className="text-gray-500 text-sm tracking-widest uppercase font-light">{sub}</p>}
    </div>
    {children}
  </div>
);

const NavButtons: React.FC<{ onNext: () => void; onBack?: () => void; nextLabel?: string; nextEnabled?: boolean }> = ({ onNext, onBack, nextLabel, nextEnabled = true }) => (
  <div className="flex space-x-6">
    {onBack && <button onClick={onBack} className="text-[10px] uppercase tracking-widest text-gray-600 hover:text-gray-200 px-6 py-3 transition-all">Back</button>}
    <button onClick={onNext} disabled={!nextEnabled} className={`text-[10px] uppercase tracking-widest px-10 py-4 rounded-full transition-all ${nextEnabled ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-gray-700 cursor-not-allowed'}`}>
      {nextLabel || 'Continue'}
    </button>
  </div>
);

export default App;
