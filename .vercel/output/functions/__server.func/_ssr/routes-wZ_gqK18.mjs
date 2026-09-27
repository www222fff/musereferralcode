import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as SiteFrame } from "./site-frame-TNazPTVs.mjs";
import { n as Copy, r as Check } from "../_libs/lucide-react.mjs";
import { a as sendFeedback, i as getPool, n as Route$1, o as shareCode, r as claimCode } from "./router-DWHDcbQY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-wZ_gqK18.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STORAGE_KEY = "relay:claim";
var CLAIM_TTL_MS = 18e5;
function ago(ms) {
	const minutes = Math.round((Date.now() - ms) / 6e4);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.round(hours / 24)}d ago`;
}
function readSaved() {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed?.claimId || !parsed.code || Date.now() - parsed.at > CLAIM_TTL_MS) {
			window.localStorage.removeItem(STORAGE_KEY);
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}
function writeSaved(claim) {
	try {
		if (!claim) window.localStorage.removeItem(STORAGE_KEY);
		else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(claim));
	} catch {}
}
function statusLine(pool) {
	if (pool.active <= 0) return "Waiting for the first code";
	const codes = pool.active === 1 ? "1 code in rotation" : `${pool.active} codes in rotation`;
	if (pool.confirmed <= 0) return codes;
	return `${codes} · ${pool.confirmed === 1 ? "1 confirmed" : `${pool.confirmed} confirmed`}`;
}
function PoolHome({ initial }) {
	const [pool, setPool] = (0, import_react.useState)(initial);
	const [claim, setClaim] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [shareNotice, setShareNotice] = (0, import_react.useState)(null);
	const [sharing, setSharing] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const saved = readSaved();
		if (saved) setClaim(saved);
	}, []);
	async function refresh() {
		const next = await getPool();
		setPool(next);
	}
	function showClaim(next, feedback) {
		const saved = {
			...next,
			at: Date.now(),
			feedback
		};
		setClaim(saved);
		writeSaved(saved);
		setCopied(false);
	}
	async function take(input) {
		setBusy(true);
		setNotice({
			tone: "plain",
			text: "Finding a code…"
		});
		try {
			const result = await claimCode({ data: input });
			if (!result.ok) {
				setNotice({
					tone: "error",
					text: result.error
				});
				return;
			}
			showClaim(result);
			setNotice(null);
		} catch {
			setNotice({
				tone: "error",
				text: "Couldn’t reach the pool. Try again."
			});
		} finally {
			setBusy(false);
		}
	}
	async function copy() {
		if (!claim) return;
		try {
			await navigator.clipboard.writeText(claim.code);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1600);
		} catch {
			setNotice({
				tone: "plain",
				text: "Select the code above to copy it."
			});
		}
	}
	async function feedback(result) {
		if (!claim || claim.feedback) return;
		setBusy(true);
		try {
			const response = await sendFeedback({ data: {
				claimId: claim.claimId,
				result
			} });
			if (!response.ok) {
				setNotice({
					tone: "error",
					text: response.error
				});
				return;
			}
			if (result === "worked") {
				showClaim(claim, "worked");
				setNotice({
					tone: "ok",
					text: "Glad it worked. If you have a code of your own, add it below."
				});
				await refresh();
				return;
			}
			setNotice({
				tone: "plain",
				text: "Noted. Finding a different code…"
			});
			const next = await claimCode({ data: { excludeId: claim.codeId } });
			await refresh();
			if (!next.ok) {
				setClaim(null);
				writeSaved(null);
				setNotice({
					tone: "error",
					text: next.error
				});
				return;
			}
			showClaim(next);
			setNotice(null);
		} catch {
			setNotice({
				tone: "error",
				text: "Couldn’t reach the pool. Try again."
			});
		} finally {
			setBusy(false);
		}
	}
	async function onShare(event) {
		event.preventDefault();
		setSharing(true);
		setShareNotice({
			tone: "plain",
			text: "Adding…"
		});
		try {
			const result = await shareCode({ data: { code: draft } });
			if (!result.ok) {
				setShareNotice({
					tone: "error",
					text: result.error
				});
				return;
			}
			setDraft("");
			setShareNotice({
				tone: "ok",
				text: `${result.code} is in the pool. We’ll start handing it out.`
			});
			setNotice(null);
			await refresh();
		} catch {
			setShareNotice({
				tone: "error",
				text: "Couldn’t reach the pool. Try again."
			});
		} finally {
			setSharing(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Community pool for Meta Muse"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "mt-3 text-4xl leading-tight font-medium tracking-tight sm:text-5xl",
					children: ["Take a code.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 block font-normal italic",
						children: "Leave one behind."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-auto mt-4 max-w-xl text-lg text-muted",
					children: "Redeem someone else’s Muse code and you both get 1 billion tokens. Relay rotates what the pool still has left, so one public post doesn’t burn a code in minutes."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto mt-8 w-full max-w-md rounded-card border border-line bg-surface p-5 text-left shadow-card",
					children: [!(claim != null) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rise",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-h-6 items-center gap-2 text-sm text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `size-2 rounded-full ${pool.active > 0 ? "bg-ok" : "bg-faint"}`,
									"aria-hidden": true
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular-nums",
									children: statusLine(pool)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "my-4 text-center font-mono text-4xl font-medium tracking-code text-faint select-none blur-sm sm:text-5xl",
								"aria-hidden": true,
								children: "K4M2QP"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "flex h-12 w-full items-center justify-center rounded-control bg-ink text-base font-medium text-bg transition-opacity duration-150 hover:opacity-90 disabled:opacity-50",
								onClick: () => void take({}),
								disabled: busy,
								children: "Get a code"
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rise",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-h-6 items-center gap-2 text-sm text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `size-2 rounded-full ${claim.verified ? "bg-ok" : "bg-warn"}`,
									"aria-hidden": true
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "tabular-nums",
									children: [
										claim.verified ? "Reported working" : "New code",
										" · ",
										"~",
										claim.remaining,
										" ",
										claim.remaining === 1 ? "use" : "uses",
										" left"
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "my-4 text-center font-mono text-4xl font-medium tracking-code text-ink select-all sm:text-5xl",
								children: claim.code
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "flex h-12 w-full items-center justify-center gap-2 rounded-control bg-ink text-base font-medium text-bg transition-opacity duration-150 hover:opacity-90",
								onClick: () => void copy(),
								children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									className: "size-4",
									"aria-hidden": true
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
									className: "size-4",
									"aria-hidden": true
								}), copied ? "Copied" : "Copy code"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-center text-sm text-muted",
								children: "In Muse, open Settings and redeem it within 48 hours of joining."
							}),
							claim.feedback !== "worked" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 border-t border-line pt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-2 text-center text-sm font-medium",
									children: "Did it work?"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap justify-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "h-10 rounded-control border border-line bg-surface px-3 text-sm font-medium hover:border-faint disabled:opacity-50",
											disabled: busy,
											onClick: () => void feedback("worked"),
											children: "Worked"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "h-10 rounded-control border border-line bg-surface px-3 text-sm font-medium hover:border-faint disabled:opacity-50",
											disabled: busy,
											onClick: () => void feedback("used_up"),
											children: "Used up"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "h-10 rounded-control border border-line bg-surface px-3 text-sm font-medium hover:border-faint disabled:opacity-50",
											disabled: busy,
											onClick: () => void feedback("invalid"),
											children: "Invalid"
										})
									]
								})]
							}) : null
						]
					}), notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: `mt-3 text-center text-sm ${notice.tone === "error" ? "text-danger" : notice.tone === "ok" ? "text-ok" : "text-muted"}`,
						role: "status",
						children: notice.text
					}) : null]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
			className: "mt-10 grid list-none gap-6 p-0 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-8 shrink-0 place-items-center rounded-full border border-line text-sm font-medium",
						children: "1"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-base font-medium",
						children: "Get a code"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Handouts favor codes with more estimated uses left."
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-8 shrink-0 place-items-center rounded-full border border-line text-sm font-medium",
						children: "2"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-base font-medium",
						children: "Redeem in Muse"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Both people get 1 billion tokens if it still has uses."
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-8 shrink-0 place-items-center rounded-full border border-line text-sm font-medium",
						children: "3"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-base font-medium",
						children: "Add your own"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "One code per browser. It joins the rotation right away."
					})] })]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			id: "share",
			className: "mt-14 scroll-mt-20 border-t border-line pt-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: (event) => void onShare(event),
				className: "mx-auto max-w-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						htmlFor: "code-input",
						className: "block text-lg font-medium",
						children: "Add your Muse code"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-col gap-3 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "code-input",
							value: draft,
							onChange: (event) => setDraft(event.target.value.toUpperCase()),
							placeholder: "e.g. K4M2QP",
							autoComplete: "off",
							autoCapitalize: "characters",
							spellCheck: false,
							maxLength: 12,
							required: true,
							className: "h-12 w-full min-w-0 flex-1 rounded-control border border-line bg-surface px-4 font-mono text-base tracking-wider text-ink uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-faint placeholder:normal-case"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: sharing,
							className: "h-12 rounded-control bg-ink px-6 text-base font-medium text-bg transition-opacity duration-150 hover:opacity-90 disabled:opacity-50",
							children: "Add to pool"
						})]
					}),
					shareNotice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: `mt-3 text-sm ${shareNotice.tone === "error" ? "text-danger" : shareNotice.tone === "ok" ? "text-ok" : "text-muted"}`,
						role: "status",
						children: shareNotice.text
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-center text-sm text-faint",
						children: "Codes are public and can run out. Never pay for one."
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-14",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-baseline justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-medium",
					children: "Recently shared"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm text-faint",
					children: "Newest first"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "overflow-hidden rounded-card border border-line bg-surface",
				children: pool.recent.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "px-4 py-6 text-center text-muted",
					children: "No codes yet. The first one added is the first one handed out."
				}) : pool.recent.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-base font-medium tracking-code",
							children: row.code
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1 text-sm text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block",
								suppressHydrationWarning: true,
								children: ["Added ", ago(row.createdMs)]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block text-faint tabular-nums",
								children: [
									"~",
									row.remaining,
									" left",
									row.verified ? " · checked" : ""
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-10 shrink-0 rounded-control border border-line px-3 text-sm font-medium hover:border-faint disabled:opacity-50",
							disabled: busy,
							onClick: () => {
								document.getElementById("share")?.scrollIntoView({ block: "nearest" });
								window.scrollTo({
									top: 0,
									behavior: "smooth"
								});
								take({ codeId: row.id });
							},
							children: "Use"
						})
					]
				}, row.id))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			id: "faq",
			className: "mt-14 scroll-mt-20",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-medium",
				children: "FAQ"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Faq, {
						q: "What do I get for using a code?",
						children: "When the code is redeemed in Muse, you and the person who shared it each get 1 billion Muse tokens. Anything more specific you read elsewhere is a rumor."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Faq, {
						q: "Where do I enter it?",
						children: "In the Muse app or on the web, open Settings and redeem the code. It has to happen within 48 hours of creating the account, so do it right after you join."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Faq, {
						q: "Why did Muse say the code was used up?",
						children: "Each code only works a limited number of times, often somewhere around 20 to 30. We can’t see Muse’s real counter. Mark it used up and we’ll hand you a different one."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Faq, {
						q: "How do you estimate uses left?",
						children: "We count how often a code is handed out. Codes with more estimated uses left are more likely to be next. A “used up” report stops further handouts. Three bad reports in a row retire it. “Worked” clears that streak."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Faq, {
						q: "Where is Muse available?",
						children: "As of late September 2026, Muse is in the US and Canada. A code will not unlock it from anywhere else."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Faq, {
						q: "Is Relay run by Meta?",
						children: "No. This is an independent pool. We never ask for a Muse or Meta login, and you should never pay for a code."
					})
				]
			})]
		})
	] });
}
function Faq({ q, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
		className: "group border-b border-line py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
			className: "flex cursor-pointer list-none items-center justify-between gap-4 font-medium",
			children: [
				q,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-faint group-open:hidden",
					"aria-hidden": true,
					children: "+"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden text-faint group-open:inline",
					"aria-hidden": true,
					children: "–"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-base text-muted",
			children
		})]
	});
}
function Home() {
	const initial = Route$1.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFrame, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PoolHome, { initial }) });
}
//#endregion
export { Home as component };
