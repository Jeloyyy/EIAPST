// lib/constants.ts - App-wide constants

export const APP_NAME = 'EIAPSTS';
export const APP_FULL_NAME = 'Employee Information & Personal Supplies Tracking System';
export const APP_TAGLINE = 'Manage employee information and track supply issuance';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  EMPLOYEES: '/employees',
  SUPPLIES: '/supplies',
  LOGS: '/logs',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  INVENTORY_STAFF: 'inventory_staff',
} as const;

export const SUPPLY_STATUS = {
  AVAILABLE: 'available',
  ISSUED: 'issued',
  RETURNED: 'returned',
  DAMAGED: 'damaged',
} as const;
