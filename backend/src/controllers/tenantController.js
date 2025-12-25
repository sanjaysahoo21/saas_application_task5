import { getTenantById, listTenants, updateTenant } from '../services/tenantService.js';

export async function getTenant(req, res) {
  try {
    const { tenantId } = req.params;
    const data = await getTenantById({ tenantId, requester: req.user });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to fetch tenant' });
  }
}

export async function listAllTenants(req, res) {
  try {
    const data = await listTenants({ requester: req.user });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to list tenants' });
  }
}

export async function updateTenantController(req, res) {
  try {
    const { tenantId } = req.params;
    const data = await updateTenant({ tenantId, requester: req.user, payload: req.body || {} });
    return res.status(200).json({ success: true, message: 'Tenant updated', data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to update tenant' });
  }
}
