interface ProgressRingProps {
    progress: number;
    size: number;
    strokeWidth: number;
    bgColor?: string;
    progressColor?: string;
  }
  
  const ProgressRing = ({ 
    progress, 
    size, 
    strokeWidth,
    bgColor = 'rgba(255, 255, 255, 0.1)',
    progressColor = '#3b82f6'
  }: ProgressRingProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;
    
    return (
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
          />
          
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        
        <div className="absolute text-xs font-bold text-white">
          {Math.round(progress)}%
        </div>
      </div>
    );
  };
  
  export default ProgressRing;