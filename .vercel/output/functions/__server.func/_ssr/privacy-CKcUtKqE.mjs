import { x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as SiteFrame } from "./site-frame-TNazPTVs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/privacy-CKcUtKqE.js
var import_jsx_runtime = require_jsx_runtime();
function Privacy() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFrame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "mx-auto max-w-xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-4xl font-medium tracking-tight",
				children: "Privacy"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-muted",
				children: "Relay is a shared list of Muse referral codes. It is not an account system, and it is not Meta."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-xl font-medium",
				children: "What we store"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-3 list-disc space-y-2 pl-5 text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "A first-party cookie on this browser, so each person can add one code and so grabs can be rate-limited. It is a random id, not your name or login." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The code you submit, when it was added, and counts of how often it was handed out or reported. Codes are public on purpose." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Which handoff this browser received, so a “worked / used up / invalid” report attaches to the right code." })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-xl font-medium",
				children: "What we don’t store"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-muted",
				children: "No Muse password, no Meta account, no email, no payment. Don’t send those to anyone who asks for a code."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "text-ink",
					children: "Back to the pool"
				})
			})
		]
	}) });
}
//#endregion
export { Privacy as component };
