/**
 * Mobile Detection Utilities
 * Detects mobile devices and provides mobile-specific capabilities
 */

export interface MobileCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isTouchDevice: boolean;
  hasGyroscope: boolean;
  hasAccelerometer: boolean;
  screenOrientation: 'portrait' | 'landscape';
  viewportSize: { width: number; height: number };
}

/**
 * Detect if device is mobile
 */
export const isMobileDevice = (): boolean => {
  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  // Check for touch support
  const hasTouchScreen =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  // Check screen size (consider devices under 768px width as mobile)
  const isSmallScreen = window.innerWidth < 768;

  return mobileRegex.test(userAgent) || (hasTouchScreen && isSmallScreen);
};

/**
 * Detect if device is a tablet
 */
export const isTabletDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const tabletRegex = /iPad|Android(?!.*Mobile)/i;
  const isLargeTouch =
    ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
    window.innerWidth >= 768 &&
    window.innerWidth <= 1024;

  return tabletRegex.test(userAgent) || isLargeTouch;
};

/**
 * Detect if device supports touch
 */
export const isTouchDevice = (): boolean => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

/**
 * Check if device has gyroscope
 */
export const hasGyroscope = async (): Promise<boolean> => {
  if (!window.DeviceOrientationEvent) {
    return false;
  }

  // For iOS 13+, need to request permission
  if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    try {
      const permission = await (DeviceOrientationEvent as any).requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.warn('DeviceOrientation permission denied:', error);
      return false;
    }
  }

  // For other devices, assume gyroscope is available if DeviceOrientationEvent exists
  return true;
};

/**
 * Check if device has accelerometer
 */
export const hasAccelerometer = (): boolean => {
  return 'DeviceMotionEvent' in window;
};

/**
 * Get current screen orientation
 */
export const getScreenOrientation = (): 'portrait' | 'landscape' => {
  const orientation = window.screen?.orientation?.type ||
                      (window.innerWidth > window.innerHeight ? 'landscape-primary' : 'portrait-primary');
  return orientation.includes('portrait') ? 'portrait' : 'landscape';
};

/**
 * Get viewport size
 */
export const getViewportSize = (): { width: number; height: number } => {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};

/**
 * Get all mobile capabilities
 */
export const getMobileCapabilities = async (): Promise<MobileCapabilities> => {
  const isMobile = isMobileDevice();
  const isTablet = isTabletDevice();
  const isTouch = isTouchDevice();
  const hasGyro = await hasGyroscope();
  const hasAccel = hasAccelerometer();
  const orientation = getScreenOrientation();
  const viewport = getViewportSize();

  return {
    isMobile,
    isTablet,
    isTouchDevice: isTouch,
    hasGyroscope: hasGyro,
    hasAccelerometer: hasAccel,
    screenOrientation: orientation,
    viewportSize: viewport
  };
};

/**
 * Request gyroscope permission (iOS 13+)
 */
export const requestGyroscopePermission = async (): Promise<boolean> => {
  if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    try {
      const permission = await (DeviceOrientationEvent as any).requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request gyroscope permission:', error);
      return false;
    }
  }
  // Permission not needed on this device
  return true;
};

/**
 * Listen for orientation changes
 */
export const onOrientationChange = (callback: (orientation: 'portrait' | 'landscape') => void): () => void => {
  const handleOrientationChange = () => {
    callback(getScreenOrientation());
  };

  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);

  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
};
