import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export function CheckInOutWidget({ onAttendanceUpdated }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { showToast } = useNotification();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchToday = async () => {
    try {
      const res = await api.getTodayAttendance();
      if (res.success) {
        setRecord(res.record);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchToday();
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await api.checkIn({ notes: 'Dashboard check-in' });
      if (res.success) {
        setRecord(res.record);
        showToast('Checked in successfully at ' + res.record.check_in, 'success');
        if (onAttendanceUpdated) onAttendanceUpdated();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const res = await api.checkOut();
      if (res.success) {
        setRecord(res.record);
        showToast('Checked out successfully at ' + res.record.check_out, 'success');
        if (onAttendanceUpdated) onAttendanceUpdated();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = !!record?.check_in;
  const isCheckedOut = !!record?.check_out;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-stone-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold tracking-wider uppercase mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Attendance Punch & Timesheet</span>
          </div>

          <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-stone-900 my-1">
            {currentTime.toLocaleTimeString()}
          </div>

          <p className="text-xs text-stone-500">
            Standard workday: 09:00 AM – 06:00 PM (8h expectation)
          </p>
        </div>

        {/* Current status pill & buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="bg-stone-50 px-4 py-2.5 rounded-xl border border-stone-200 flex items-center justify-between sm:justify-start gap-4">
            <div>
              <div className="text-[10px] text-stone-400 uppercase font-bold">Today Status</div>
              <div className="text-xs font-bold mt-0.5">
                {!isCheckedIn ? (
                  <span className="text-amber-700">Not Punched In</span>
                ) : !isCheckedOut ? (
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Present (Logged In)
                  </span>
                ) : (
                  <span className="text-stone-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Punched Out
                  </span>
                )}
              </div>
            </div>

            {isCheckedIn && (
              <div className="border-l border-stone-200 pl-4">
                <div className="text-[10px] text-stone-400 uppercase font-bold">Check-In</div>
                <div className="text-xs font-mono font-bold text-stone-900 mt-0.5">{record.check_in}</div>
              </div>
            )}

            {isCheckedOut && (
              <div className="border-l border-stone-200 pl-4">
                <div className="text-[10px] text-stone-400 uppercase font-bold">Total Duration</div>
                <div className="text-xs font-mono font-bold text-stone-900 mt-0.5">
                  {Math.floor(record.duration_minutes / 60)}h {record.duration_minutes % 60}m
                </div>
              </div>
            )}
          </div>

          <div>
            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-stone-950 text-stone-950" />
                <span>{loading ? 'Processing...' : 'Punch In Now'}</span>
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white text-white" />
                <span>{loading ? 'Processing...' : 'Punch Out'}</span>
              </button>
            ) : (
              <div className="text-center py-2 px-4 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-600 font-semibold">
                Shift Complete
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckInOutWidget;
