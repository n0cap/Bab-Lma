import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

interface IconProps {
  size?: number;
  color?: string;
}

const strokeCommon = {
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.8,
};

export function HomeIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 10.2L12 3l9 7.2V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20v-9.8Z" stroke={color} {...strokeCommon} />
      <Path d="M9 21.5V13h6v8.5" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function OrdersIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="3.5" width="14" height="18" rx="2" stroke={color} {...strokeCommon} />
      <Line x1="8" y1="8" x2="16" y2="8" stroke={color} {...strokeCommon} />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} {...strokeCommon} />
      <Line x1="8" y1="16" x2="13" y2="16" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function LoyaltyIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20.5c-5.8-3.5-9-6.8-9-10.5a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 10c0 3.7-3.2 7-9 10.5Z" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function SettingsIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10.2 3.7h3.6l.8 2.1a6.5 6.5 0 0 1 1.6.9l2.1-.8 1.8 3.1-1.5 1.6a6.6 6.6 0 0 1 0 1.8l1.5 1.6-1.8 3.1-2.1-.8a6.5 6.5 0 0 1-1.6.9l-.8 2.1h-3.6l-.8-2.1a6.5 6.5 0 0 1-1.6-.9l-2.1.8-1.8-3.1 1.5-1.6a6.6 6.6 0 0 1 0-1.8L3.8 9l1.8-3.1 2.1.8a6.5 6.5 0 0 1 1.6-.9l.9-2.1Z" stroke={color} {...strokeCommon} />
      <Circle cx="12" cy="12" r="2.6" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function CleaningIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 3l4 4" stroke={color} {...strokeCommon} />
      <Path d="M7 20h10l-2.5-5.5H9.5L7 20Z" stroke={color} {...strokeCommon} />
      <Path d="M16 7 10 13" stroke={color} {...strokeCommon} />
      <Line x1="9" y1="20" x2="8" y2="22" stroke={color} {...strokeCommon} />
      <Line x1="12" y1="20" x2="12" y2="22" stroke={color} {...strokeCommon} />
      <Line x1="15" y1="20" x2="16" y2="22" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function CookingIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 11h10a2 2 0 0 1 2 2v2H5v-2a2 2 0 0 1 2-2Z" stroke={color} {...strokeCommon} />
      <Path d="M6 15h12l-1 5H7l-1-5Z" stroke={color} {...strokeCommon} />
      <Path d="M8 11V8.5a4 4 0 0 1 8 0V11" stroke={color} {...strokeCommon} />
      <Line x1="20" y1="13" x2="22" y2="13" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function BabysittingIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="2.8" stroke={color} {...strokeCommon} />
      <Path d="M7 20v-2.5a5 5 0 0 1 10 0V20" stroke={color} {...strokeCommon} />
      <Path d="M5 15.5c1.7 1.2 4.2 2 7 2s5.3-.8 7-2" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function PlumbingIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14.5 4.5 19.5 9.5" stroke={color} {...strokeCommon} />
      <Path d="M10.5 8.5 4 15a2.1 2.1 0 0 0 3 3l6.5-6.5" stroke={color} {...strokeCommon} />
      <Path d="M13.8 5.2 9.6 9.4l5 5 4.2-4.2a2.8 2.8 0 0 0 0-4l-1-1a2.8 2.8 0 0 0-4 0Z" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function ElectricalIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2 5 13h6l-1 9 9-12h-6l0-8Z" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function ITIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="12" rx="2" stroke={color} {...strokeCommon} />
      <Path d="M9 21h6" stroke={color} {...strokeCommon} />
      <Path d="M12 17v4" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function SearchIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6" stroke={color} {...strokeCommon} />
      <Path d="m20 20-4.2-4.2" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m6 9 6 6 6-6" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m9 6 6 6-6 6" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function ArrowRightIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke={color} {...strokeCommon} />
      <Path d="m13 6 6 6-6 6" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function BackIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m15 6-6 6 6 6" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function CheckIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} {...strokeCommon} />
      <Path d="m8.5 12.3 2.2 2.4 4.8-5" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function CloseIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} {...strokeCommon} />
      <Path d="m9 9 6 6" stroke={color} {...strokeCommon} />
      <Path d="m15 9-6 6" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function InfoIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} {...strokeCommon} />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} {...strokeCommon} />
      <Circle cx="12" cy="8" r="0.9" fill={color} />
    </Svg>
  );
}

export function WarningIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4 21 20H3L12 4Z" stroke={color} {...strokeCommon} />
      <Line x1="12" y1="9" x2="12" y2="13.5" stroke={color} {...strokeCommon} />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

export function StarIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m12 3.5 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.4 6.6 20.3l1-6.1L3.2 9.9l6.1-.9L12 3.5Z"
        fill={color}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      />
    </Svg>
  );
}

export function StarOutlineIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m12 3.5 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.4 6.6 20.3l1-6.1L3.2 9.9l6.1-.9L12 3.5Z" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function CameraIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="14" rx="2" stroke={color} {...strokeCommon} />
      <Path d="M9 6 10.2 4h3.6L15 6" stroke={color} {...strokeCommon} />
      <Circle cx="12" cy="13" r="3.2" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function MicIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="4" width="6" height="10" rx="3" stroke={color} {...strokeCommon} />
      <Path d="M6.5 11.5a5.5 5.5 0 0 0 11 0" stroke={color} {...strokeCommon} />
      <Line x1="12" y1="17" x2="12" y2="21" stroke={color} {...strokeCommon} />
      <Line x1="9" y1="21" x2="15" y2="21" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function SendIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 11.5 21 3l-6.8 18-2.5-7L4 11.5Z" stroke={color} {...strokeCommon} />
      <Path d="M21 3 11.7 14" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function ClockIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} {...strokeCommon} />
      <Path d="M12 7v5l3 2" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function LocationPinIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11Z" stroke={color} {...strokeCommon} />
      <Circle cx="12" cy="10" r="2.5" stroke={color} {...strokeCommon} />
    </Svg>
  );
}

export function ChatIcon({ size = 24, color = colors.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 6.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-8l-4 3v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" stroke={color} {...strokeCommon} />
      <Circle cx="9" cy="12" r="0.8" fill={color} />
      <Circle cx="12" cy="12" r="0.8" fill={color} />
      <Circle cx="15" cy="12" r="0.8" fill={color} />
    </Svg>
  );
}
