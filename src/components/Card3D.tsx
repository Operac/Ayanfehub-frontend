import { useRef, useState } from 'react';
import { motion, useSpring, useTransform, MotionValue } from 'framer-motion';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
  scale?: number;
}

function GlareLayer({ x, y }: { x: MotionValue<string>; y: MotionValue<string> }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-[inherit] pointer-events-none overflow-hidden"
      style={{
        background: 'transparent',
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: useTransform(
            [x, y] as MotionValue[],
            ([gx, gy]: string[]) =>
              `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.2) 0%, transparent 55%)`
          ),
        }}
      />
    </motion.div>
  );
}

/**
 * A card that tilts in 3D perspective following the mouse cursor.
 * Wraps any content. Uses framer-motion springs for a smooth, physical feel.
 */
export default function Card3D({
  children,
  className = '',
  intensity = 12,
  glare = true,
  scale = 1.02,
}: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const rawX = useSpring(0, { stiffness: 200, damping: 22 });
  const rawY = useSpring(0, { stiffness: 200, damping: 22 });
  const scaleSpring = useSpring(1, { stiffness: 200, damping: 22 });

  const rotateX = useTransform(rawY, v => -v * intensity);
  const rotateY = useTransform(rawX, v =>  v * intensity);

  // Percentage strings for glare position
  const glareX = useTransform(rawX, [-1, 1], ['0%', '100%']);
  const glareY = useTransform(rawY, [-1, 1], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    rawX.set(x);
    rawY.set(y);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    scaleSpring.set(scale);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rawX.set(0);
    rawY.set(0);
    scaleSpring.set(1);
  };

  return (
    <div style={{ perspective: '1000px' }} className={`h-full ${className}`}>
      <motion.div
        ref={ref}
        style={{ rotateX, rotateY, scale: scaleSpring, transformStyle: 'preserve-3d' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-full"
      >
        {children}
        {glare && isHovered && <GlareLayer x={glareX} y={glareY} />}
      </motion.div>
    </div>
  );
}
