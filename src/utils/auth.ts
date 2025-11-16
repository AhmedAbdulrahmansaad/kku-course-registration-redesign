/**
 * Authentication Utilities
 * يحتوي على دوال مساعدة للمصادقة وإدارة الجلسات
 */

import { projectId } from './supabase/info';

/**
 * فحص صلاحية الـ access token
 * @returns true إذا كان الـ token صالحاً، false إذا كان منتهي أو غير صالح
 */
export async function isTokenValid(): Promise<boolean> {
  try {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      console.warn('⚠️ [Auth] No access token found');
      return false;
    }

    console.log('🔍 [Auth] Checking token validity...');

    // محاولة استخدام الـ token في طلب بسيط
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 401) {
      console.warn('⚠️ [Auth] Token is invalid or expired');
      return false;
    }

    if (response.ok) {
      console.log('✅ [Auth] Token is valid');
      return true;
    }

    console.warn('⚠️ [Auth] Unexpected response:', response.status);
    return false;
  } catch (error) {
    console.error('❌ [Auth] Error checking token validity:', error);
    return false;
  }
}

/**
 * تسجيل خروج المستخدم ومسح جميع البيانات المحلية
 */
export function logout(): void {
  console.log('🚪 [Auth] Logging out user...');
  
  // مسح جميع البيانات المحلية
  localStorage.removeItem('access_token');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('hasPledgeAccepted');
  
  console.log('✅ [Auth] User logged out successfully');
}

/**
 * الحصول على الـ access token من localStorage
 * @returns access token أو null إذا لم يكن موجوداً
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * حفظ الـ access token في localStorage
 */
export function setAccessToken(token: string): void {
  localStorage.setItem('access_token', token);
  console.log('✅ [Auth] Access token saved');
}

/**
 * فحص إذا كان المستخدم مسجل دخول
 */
export function isLoggedIn(): boolean {
  const hasToken = !!getAccessToken();
  const hasUserInfo = !!localStorage.getItem('userInfo');
  const isLoggedInFlag = localStorage.getItem('isLoggedIn') === 'true';
  
  return hasToken && hasUserInfo && isLoggedInFlag;
}

/**
 * الحصول على معلومات المستخدم من localStorage
 */
export function getUserInfo(): any | null {
  try {
    const userInfoStr = localStorage.getItem('userInfo');
    if (!userInfoStr) return null;
    return JSON.parse(userInfoStr);
  } catch (error) {
    console.error('❌ [Auth] Error parsing userInfo:', error);
    return null;
  }
}

/**
 * فحص صلاحية الجلسة وتسجيل خروج تلقائي إذا كانت منتهية
 * @returns true إذا كانت الجلسة صالحة، false إذا كانت منتهية
 */
export async function validateSessionOrLogout(): Promise<boolean> {
  if (!isLoggedIn()) {
    console.warn('⚠️ [Auth] User not logged in');
    return false;
  }

  const valid = await isTokenValid();
  if (!valid) {
    console.warn('⚠️ [Auth] Session expired, logging out...');
    logout();
    return false;
  }

  return true;
}
