import { registerTenantService, loginService, meService } from '../services/authService.js';

export async function registerTenant(req, res) {
  try {
    const { name, subdomain, plan, admin } = req.body || {};
    const result = await registerTenantService({ name, subdomain, plan, admin });
    return res.status(201).json({ success: true, message: 'Tenant registered', data: result });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to register tenant' });
  }
}

export async function login(req, res) {
  try {
    const { email, password, subdomain } = req.body || {};
    const result = await loginService({ email, password, subdomain });
    return res.status(200).json({ success: true, message: 'Login successful', data: result });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Login failed' });
  }
}

export async function me(req, res) {
  try {
    const result = await meService({ userId: req.user.userId });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to load profile' });
  }
}

export async function logout(_req, res) {
  // Stateless JWT: logout is a no-op server side.
  return res.status(200).json({ success: true, message: 'Logged out' });
}
