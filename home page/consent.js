(function () {
    var CONSENT_KEY = "tsg_consent_v1";
    var STYLE_ID = "tsg-consent-style";
    var grantedConsent = {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted"
    };
    var deniedConsent = {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied"
    };

    function updateGoogleConsent(mode) {
        if (typeof window.gtag !== "function") {
            return;
        }
        window.gtag("consent", "update", mode === "accepted" ? grantedConsent : deniedConsent);
    }

    function dispatchConsentEvent(mode) {
        var eventName = mode === "accepted" ? "tsg-consent-granted" : "tsg-consent-denied";
        window.dispatchEvent(new CustomEvent(eventName));
    }

    function saveConsent(mode) {
        try {
            localStorage.setItem(CONSENT_KEY, mode);
        } catch (err) {
            // Ignore storage failures and still apply runtime consent.
        }
        updateGoogleConsent(mode);
        dispatchConsentEvent(mode);
    }

    function getSavedConsent() {
        try {
            return localStorage.getItem(CONSENT_KEY);
        } catch (err) {
            return null;
        }
    }

    function closeBanner(banner) {
        if (banner && banner.parentNode) {
            banner.parentNode.removeChild(banner);
        }
    }

    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        var style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = ""
            + ".tsg-consent-banner{position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:4000;background:#fffdf7;color:#111;border:3px solid #111;box-shadow:10px 10px 0 #111;padding:1rem;font-family:'IBM Plex Mono',monospace;max-width:860px;margin:0 auto;}"
            + ".tsg-consent-title{margin:0 0 .45rem 0;font-weight:700;font-size:.9rem;text-transform:uppercase;letter-spacing:.06em;}"
            + ".tsg-consent-text{margin:0;font-size:.8rem;line-height:1.55;}"
            + ".tsg-consent-actions{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.9rem;}"
            + ".tsg-consent-btn{display:inline-flex;align-items:center;justify-content:center;text-align:center;border:2px solid #111;background:#fff;color:#111;padding:.55rem .8rem;cursor:pointer;font:600 .72rem 'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.05em;line-height:1.3;text-decoration:none;min-height:38px;}"
            + ".tsg-consent-btn.primary{background:#111;color:#f4f1ea;}"
            + ".tsg-consent-btn:hover{background:#e3fdc0;}"
            + ".tsg-consent-manage{position:fixed;right:1rem;bottom:1rem;z-index:3990;border:2px solid #111;background:#fffdf7;color:#111;box-shadow:4px 4px 0 #111;padding:.45rem .65rem;cursor:pointer;font:600 .65rem 'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.04em;}"
            + ".tsg-consent-manage:hover{background:#e3fdc0;}"
            + "@media (max-width:560px){.tsg-consent-banner{left:.55rem;right:.55rem;bottom:.55rem;padding:.9rem;border-width:2px;box-shadow:0 12px 30px rgba(0,0,0,.35),4px 4px 0 #111;background:#ffffff;}.tsg-consent-btn{width:100%;}.tsg-consent-manage{right:.55rem;bottom:.55rem;}}";
        document.head.appendChild(style);
    }

    function createBanner() {
        ensureStyles();

        var banner = document.createElement("section");
        banner.className = "tsg-consent-banner";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-label", "Cookie and ad consent");
        banner.innerHTML = ""
            + "<p class='tsg-consent-title'>Privacy Choices</p>"
            + "<p class='tsg-consent-text'>This site can use Google services for analytics and ads. Choose whether to allow measurement and ad personalization. You can change this anytime from the Privacy Choices button.</p>"
            + "<div class='tsg-consent-actions'>"
            + "<button type='button' class='tsg-consent-btn primary' data-consent='accepted'>Accept all</button>"
            + "<button type='button' class='tsg-consent-btn' data-consent='rejected'>Reject non-essential</button>"
            + "<a class='tsg-consent-btn' href='privacy.html'>Read privacy policy</a>"
            + "</div>";

        document.body.appendChild(banner);

        banner.addEventListener("click", function (evt) {
            var target = evt.target;
            if (!(target instanceof HTMLElement)) {
                return;
            }
            var mode = target.getAttribute("data-consent");
            if (!mode) {
                return;
            }
            saveConsent(mode);
            closeBanner(banner);
            showManageButton();
        });

        return banner;
    }

    function showManageButton() {
        ensureStyles();
        if (document.querySelector(".tsg-consent-manage")) {
            return;
        }
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tsg-consent-manage";
        btn.textContent = "Privacy choices";
        btn.addEventListener("click", function () {
            var existing = document.querySelector(".tsg-consent-banner");
            if (existing) {
                return;
            }
            createBanner();
            btn.remove();
        });
        document.body.appendChild(btn);
    }

    window.tsgRunAfterConsent = function (callback) {
        if (typeof callback !== "function") {
            return;
        }
        if (getSavedConsent() === "accepted") {
            callback();
            return;
        }
        window.addEventListener("tsg-consent-granted", function onGranted() {
            window.removeEventListener("tsg-consent-granted", onGranted);
            callback();
        });
    };

    var saved = getSavedConsent();
    if (saved === "accepted" || saved === "rejected") {
        updateGoogleConsent(saved);
        dispatchConsentEvent(saved);
        showManageButton();
    } else {
        createBanner();
    }
})();
