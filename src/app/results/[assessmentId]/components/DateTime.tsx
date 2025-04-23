// src/app/results/[assessmentId]/components/DateTime.tsx
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface DateTimeProps {
  initialTime: string;
}

export const DateTime = ({ initialTime }: DateTimeProps) => {
  const [currentTime, setCurrentTime] = useState(initialTime);

  useEffect(() => {
    const timer = setInterval(() => {
      const utcDate = new Date();
      const bangkokTime = toZonedTime(utcDate, 'Asia/Bangkok');
      setCurrentTime(format(bangkokTime, 'yyyy-MM-dd HH:mm:ss'));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-sm text-blue-300">
      {currentTime} (UTC+7)
    </div>
  );
};