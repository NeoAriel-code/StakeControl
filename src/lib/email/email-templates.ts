function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export function renderEmailTemplate({ eyebrow, title, bodyHtml, bodyText, ctaLabel, ctaUrl, footerNote }: { eyebrow: string; title: string; bodyHtml: string; bodyText: string; ctaLabel: string; ctaUrl: string; footerNote: string }) {
  const safeUrl = escapeHtml(ctaUrl);
  return {
    html: `<!doctype html><html><body style="margin:0;background:#EAF0F0;font-family:Arial,sans-serif;color:#183238"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden"><tr><td style="background:#0B252B;padding:28px 36px;color:#FFFFFF"><div style="font-size:22px;font-weight:700;letter-spacing:-.4px">StakeControl</div><div style="margin-top:12px;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#B8D9D3">${escapeHtml(eyebrow)}</div></td></tr><tr><td style="padding:36px"><h1 style="margin:0 0 16px;font-size:27px;line-height:34px;color:#0B252B">${escapeHtml(title)}</h1><div style="font-size:16px;line-height:25px">${bodyHtml}</div><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#D7F05B;color:#0B252B;padding:14px 20px;border-radius:8px;font-weight:700;text-decoration:none">${escapeHtml(ctaLabel)}</a></p><p style="font-size:12px;line-height:18px;color:#587075">${escapeHtml(footerNote)}</p></td></tr><tr><td style="padding:18px 36px;background:#F4F8F8;font-size:12px;color:#587075">StakeControl · Registro responsable de tu actividad</td></tr></table></td></tr></table></body></html>`,
    text: `${title}\n\n${bodyText}\n\n${ctaLabel}: ${ctaUrl}\n\n${footerNote}`,
  };
}
