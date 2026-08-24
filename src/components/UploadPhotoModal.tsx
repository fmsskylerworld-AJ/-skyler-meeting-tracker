import React, { useState } from 'react';
import { Meeting, MeetingCompletionLog } from '../types/meeting';
import { formatDateKey, formatDateDisplay } from '../utils/frequencyEngine';
import { compressImageFile, saveLogAsync } from '../services/storage';
import { playCompletionVictorySound } from '../utils/soundEngine';
import confetti from 'canvas-confetti';
import { Camera, X, Upload, CheckCircle2, UserCheck, FileText, Trash2, Sparkles, AlertCircle } from 'lucide-react';

interface UploadPhotoModalProps {
  meeting: Meeting;
  selectedDate: Date;
  existingLog?: MeetingCompletionLog;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadPhotoModal: React.FC<UploadPhotoModalProps> = ({
  meeting,
  selectedDate,
  existingLog,
  onClose,
  onSuccess,
}) => {
  const [photos, setPhotos] = useState<string[]>(existingLog?.photos || []);
  const [mom, setMom] = useState<string>(existingLog?.mom || '');
  const [actualAttendees, setActualAttendees] = useState<string[]>(
    existingLog?.actualAttendees || meeting.attendees
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      const files = Array.from(e.target.files);
      const compressedResults: string[] = [];

      for (const file of files) {
        const compressedDataUrl = await compressImageFile(file, 900, 0.82);
        compressedResults.push(compressedDataUrl);
      }

      setPhotos((prev) => [...prev, ...compressedResults]);
    } catch (err) {
      console.error('Image upload failed:', err);
      setErrorMsg('Failed to process image file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleAttendee = (person: string) => {
    setActualAttendees((prev) =>
      prev.includes(person) ? prev.filter((p) => p !== person) : [...prev, person]
    );
  };

  const handleSave = async () => {
    if (photos.length === 0) {
      setErrorMsg('Please upload at least 1 photo proof of the meeting.');
      return;
    }

    setIsUploading(true);

    const dateKey = formatDateKey(selectedDate);
    const newLog: MeetingCompletionLog = {
      id: existingLog?.id || `log-${meeting.id}-${dateKey}`,
      meetingId: meeting.id,
      meetingName: meeting.meetingName,
      unit: meeting.unit,
      department: meeting.department,
      completedDate: dateKey,
      completedAt: new Date().toISOString(),
      photos: photos,
      mom: mom,
      actualAttendees: actualAttendees,
      leadBy: meeting.leadBy,
    };

    await saveLogAsync(newLog);

    playCompletionVictorySound();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    setIsUploading(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shadow-sm">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Meeting Proof & Photo Upload</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {meeting.meetingName} • <span className="text-blue-700 font-bold">{meeting.unit}</span> ({formatDateDisplay(selectedDate)})
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* Photo Dropzone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" /> Upload Meeting Proof Photos <span className="text-rose-500">*</span>
            </label>

            <div className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-slate-50/80 rounded-2xl p-6 text-center transition cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="photo-file-input"
              />
              <label htmlFor="photo-file-input" className="cursor-pointer block">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 group-hover:border-blue-400 group-hover:bg-blue-50 text-blue-600 mx-auto flex items-center justify-center transition shadow-sm">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800 mt-3">
                  Click or drag photo files here
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Upload attendance, whiteboards, or meeting room proof (JPG, PNG, WebP)
                </p>
              </label>
            </div>

            {/* Photo Thumbnails */}
            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={photo} alt={`Proof ${idx + 1}`} className="w-full h-24 object-cover" />
                    <button
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow-md"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Minutes of Meeting (MoM) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" /> Minutes of Meeting (MoM) & Key Notes
            </label>
            <textarea
              rows={3}
              placeholder="Record key decisions, action points, and discussion summary..."
              value={mom}
              onChange={(e) => setMom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* Actual Attendees */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" /> Verify Attendees Present
            </label>
            <div className="flex flex-wrap gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {meeting.attendees.map((person, idx) => {
                const isChecked = actualAttendees.includes(person);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleAttendee(person)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      isChecked
                        ? 'bg-blue-100 text-blue-950 border border-blue-300'
                        : 'bg-white text-slate-400 border border-slate-200 opacity-60'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isChecked ? 'text-blue-700' : 'text-slate-400'}`} />
                    {person}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isUploading}
            className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Save Proof & Mark Completed</span>
          </button>
        </div>
      </div>
    </div>
  );
};
