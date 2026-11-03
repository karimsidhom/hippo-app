"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Compass,
  Download,
  Globe,
  MoreVertical,
  Share,
  SquarePlus,
  type LucideIcon,
} from "lucide-react";
import { HippoMark } from "@/components/HippoMark";
import { usePWAInstall, type PWAInstallState } from "@/hooks/usePWAInstall";
import "../onboarding.css";

export default function InstallPage() {
  const router = useRouter();
  const { kind, canInstallNative, installing, triggerInstall } =
    usePWAInstall();

  const [triedInstall, setTriedInstall] = useState<"accepted" | "dismissed" | null>(null);

  // Auto-skip logic: if we're running inside the PWA already (e.g. user
  // re-opens from home screen), send them straight through — this page
  // has nothing to say to an already-installed user.
  useEffect(() => {
    if (kind === "installed" && !installing) {
      const t = setTimeout(() => router.replace("/welcome"), 400);
      return () => clearTimeout(t);
    }
  }, [kind, installing, router]);

  const handleInstall = async () => {
    const result = await triggerInstall();
    setTriedInstall(result === "accepted" ? "accepted" : "dismissed");
    if (result === "accepted") {
      // Give the browser a moment to show the install animation, then go.
      setTimeout(() => router.replace("/welcome"), 800);
    }
  };

  const handleSkip = () => router.replace("/welcome");

  const installed = kind === "installed" || triedInstall === "accepted";

  return (
    <div className="onboarding">
      <header className="onboarding__topbar">
        <div className="onboarding__topbar-inner">
          <div className="onboarding__brand">
            <HippoMark size={28} />
            <span>Hippo Cases</span>
          </div>
          <span className="onboarding__eyebrow">LAST STEP</span>
        </div>
      </header>

      <main className="onboarding__main">
        <section className="onboarding__step" aria-labelledby="install-title">
          <div className="onboarding__heading">
            <h1 id="install-title" className="onboarding__title">
              Add Hippo to your home screen
            </h1>
            <p className="onboarding__description">
              Opens full screen, like an app, and works offline in the OR.
            </p>
          </div>

          {installed ? (
            <div className="onboarding__card onboarding__install-status" role="status">
              <CheckCircle2 size={24} className="onboarding__install-icon" aria-hidden="true" />
              <div className="onboarding__install-copy">
                <h2>Hippo is installed</h2>
                <p>Tap the Hippo icon on your home screen to open it next time.</p>
              </div>
            </div>
          ) : (
            <InstallGuide kind={kind} />
          )}
        </section>
      </main>

      <footer className="onboarding__footer">
        <div className="onboarding__footer-inner">
          <div className="onboarding__install-actions">
            {kind === "native" && !installed && (
              <button
                type="button"
                className="onboarding__button onboarding__button--primary onboarding__button--full"
                onClick={handleInstall}
                disabled={!canInstallNative || installing}
              >
                <Download size={18} aria-hidden="true" />
                {installing ? "Opening install sheet..." : "Install Hippo"}
              </button>
            )}
            <button
              type="button"
              className="onboarding__button onboarding__button--quiet onboarding__button--full"
              onClick={handleSkip}
            >
              Skip, continue in the browser
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface InstallInstruction {
  title: string;
  description: string;
  icon: LucideIcon;
}

function InstallGuide({ kind }: { kind: PWAInstallState["kind"] }) {
  let steps: InstallInstruction[];

  if (kind === "native") {
    steps = [
      {
        title: "Choose Install Hippo",
        description: "Use the button below to open your browser's installation prompt.",
        icon: Download,
      },
      {
        title: "Confirm installation",
        description: "Hippo will appear on your home screen or in your apps.",
        icon: Check,
      },
    ];
  } else if (kind === "ios") {
    steps = [
      {
        title: "Tap the Share icon",
        description: "At the bottom of Safari.",
        icon: Share,
      },
      {
        title: 'Tap "Add to Home Screen"',
        description: "Scroll down if you don't see it.",
        icon: SquarePlus,
      },
      {
        title: 'Tap "Add" in the top right',
        description: "Hippo lands on your home screen.",
        icon: Check,
      },
    ];
  } else if (kind === "chrome-manual") {
    steps = [
      {
        title: "Open the browser menu",
        description: "Tap or click the three dots in Chrome or Edge.",
        icon: MoreVertical,
      },
      {
        title: 'Choose "Install app" or "Add to Home screen"',
        description: "On desktop, the install option may be under the save and share menu.",
        icon: SquarePlus,
      },
      {
        title: "Confirm installation",
        description: "Hippo will appear on your home screen or in your apps.",
        icon: Check,
      },
    ];
  } else if (kind === "ios-chrome") {
    steps = [
      {
        title: "Open Hippo in Safari",
        description: "Open hippomedicine.com in Safari on your iPhone or iPad.",
        icon: Compass,
      },
      {
        title: "Tap the Share icon",
        description: "Find it at the bottom of Safari.",
        icon: Share,
      },
      {
        title: 'Choose "Add to Home Screen", then "Add"',
        description: "Hippo will appear on your home screen.",
        icon: SquarePlus,
      },
    ];
  } else if (kind === "in-app-browser") {
    steps = [
      {
        title: "Open this browser's menu",
        description: "Choose the option to open this page in Safari or Chrome.",
        icon: MoreVertical,
      },
      {
        title: "Follow your browser's install steps",
        description: "Safari uses Share, then Add to Home Screen. Chrome offers an install option in its menu.",
        icon: SquarePlus,
      },
    ];
  } else {
    steps = [
      {
        title: "Open a supported browser",
        description: "Open hippomedicine.com in Safari on iPhone or iPad, or Chrome on Android or desktop.",
        icon: Globe,
      },
      {
        title: "Follow your browser's install steps",
        description: "Safari uses Share, then Add to Home Screen. Chrome offers an install option in its menu.",
        icon: SquarePlus,
      },
    ];
  }

  return (
    <>
      <ol className="onboarding__install-steps">
        {steps.map(({ title, description, icon: Icon }, index) => (
          <li className="onboarding__install-step" key={title}>
            <span className="onboarding__install-number" aria-hidden="true">{index + 1}</span>
            <div className="onboarding__install-copy">
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <Icon size={20} className="onboarding__install-icon" aria-hidden="true" />
          </li>
        ))}
      </ol>
      {kind !== "native" && kind !== "ios" && (
        <p className="onboarding__muted">You can still use Hippo in your browser.</p>
      )}
    </>
  );
}
