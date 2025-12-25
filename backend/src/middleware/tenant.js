// Tenant isolation helper: derive tenant context from token only.
// Do NOT read tenant_id from body/query; attach req.tenantId from req.user.
export function enforceTenantContext(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  req.tenantId = req.user.tenantId;
  return next();
}
