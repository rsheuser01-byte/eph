import {
  getTrustpilotInviteKey,
  isTrustpilotInviteEnabled,
} from "@/lib/trustpilot/config";

/**
 * Trustpilot Invitation JS bootstrap in <head>, matching their verify snippet
 * so domain checks can see invitejs.trustpilot.com in the HTML source.
 */
export function TrustpilotScript() {
  if (!isTrustpilotInviteEnabled()) {
    return null;
  }

  const key = getTrustpilotInviteKey();
  return (
    <script
      id="trustpilot-invite"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,r,n){w.TrustpilotObject=n;w[n]=w[n]||function(){(w[n].q=w[n].q||[]).push(arguments)};
            a=d.createElement(s);a.async=1;a.src=r;a.type='text/java'+s;f=d.getElementsByTagName(s)[0];
            f.parentNode.insertBefore(a,f)})(window,document,'script', 'https://invitejs.trustpilot.com/tp.min.js', 'tp');
            tp('register', '${key}');`,
      }}
    />
  );
}
