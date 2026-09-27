import { x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/site-frame-TNazPTVs.js
var import_jsx_runtime = require_jsx_runtime();
function SiteFrame({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-10 border-b border-line bg-bg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "text-lg font-medium tracking-tight no-underline",
						children: "Relay"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex items-center gap-5 text-base text-muted",
						"aria-label": "Main",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/#share",
							className: "no-underline hover:text-ink",
							children: "Share"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/#faq",
							className: "no-underline hover:text-ink",
							children: "FAQ"
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-16 sm:px-6 sm:pt-16",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "border-t border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-6 text-center text-sm text-faint sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Independent pool. Not affiliated with or endorsed by Meta." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/privacy",
						className: "text-muted no-underline hover:text-ink",
						children: "Privacy"
					}) })]
				})
			})
		]
	});
}
//#endregion
export { SiteFrame as t };
