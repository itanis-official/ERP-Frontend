import axios from 'axios';

export const helpdeskApi = axios.create({
  baseURL: '/api/helpdesk',
  headers: { 'Content-Type': 'application/json' },
});

export const timesheetApi = axios.create({
  baseURL: '/api/timesheet',
  headers: { 'Content-Type': 'application/json' },
});