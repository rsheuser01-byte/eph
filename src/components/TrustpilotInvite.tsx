"use client";

import { useEffect } from "react";
import {
  createTrustpilotInvitationOnce,
  type TrustpilotInvitation,
  type TrustpilotQueue,
} from "@/lib/trustpilot/invitation";

declare global {
  interface Window {
    tp?: TrustpilotQueue;
  }
}

type Props = {
  invitation?: TrustpilotInvitation | null;
};

export function TrustpilotInvite({ invitation }: Props) {
  useEffect(() => {
    if (!invitation) {
      return;
    }

    const send = () =>
      createTrustpilotInvitationOnce({
        tp: window.tp,
        invitation,
        storage: window.localStorage,
      });

    if (send()) {
      return;
    }

    const startedAt = Date.now();
    const id = window.setInterval(() => {
      if (send() || Date.now() - startedAt > 10_000) {
        window.clearInterval(id);
      }
    }, 250);

    return () => window.clearInterval(id);
  }, [invitation]);

  return null;
}
