import "/Finance-app/node_modules/vite/dist/client/env.mjs";

//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.87.0/node_modules/@oxc-project/runtime/src/helpers/esm/typeof.js
function _typeof(o) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o$1) {
		return typeof o$1;
	} : function(o$1) {
		return o$1 && "function" == typeof Symbol && o$1.constructor === Symbol && o$1 !== Symbol.prototype ? "symbol" : typeof o$1;
	}, _typeof(o);
}

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.87.0/node_modules/@oxc-project/runtime/src/helpers/esm/toPrimitive.js
function toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.87.0/node_modules/@oxc-project/runtime/src/helpers/esm/toPropertyKey.js
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.87.0/node_modules/@oxc-project/runtime/src/helpers/esm/defineProperty.js
function _defineProperty(e, r, t) {
	return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
		value: t,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[r] = t, e;
}

//#endregion
//#region src/shared/hmr.ts
var HMRContext = class {
	constructor(hmrClient$1, ownerPath) {
		this.hmrClient = hmrClient$1;
		this.ownerPath = ownerPath;
		_defineProperty(this, "newListeners", void 0);
		if (!hmrClient$1.dataMap.has(ownerPath)) hmrClient$1.dataMap.set(ownerPath, {});
		const mod = hmrClient$1.hotModulesMap.get(ownerPath);
		if (mod) mod.callbacks = [];
		const staleListeners = hmrClient$1.ctxToListenersMap.get(ownerPath);
		if (staleListeners) for (const [event, staleFns] of staleListeners) {
			const listeners = hmrClient$1.customListenersMap.get(event);
			if (listeners) hmrClient$1.customListenersMap.set(event, listeners.filter((l) => !staleFns.includes(l)));
		}
		this.newListeners = /* @__PURE__ */ new Map();
		hmrClient$1.ctxToListenersMap.set(ownerPath, this.newListeners);
	}
	get data() {
		return this.hmrClient.dataMap.get(this.ownerPath);
	}
	accept(deps, callback) {
		if (typeof deps === "function" || !deps) this.acceptDeps([this.ownerPath], ([mod]) => deps?.(mod));
		else if (typeof deps === "string") this.acceptDeps([deps], ([mod]) => callback?.(mod));
		else if (Array.isArray(deps)) this.acceptDeps(deps, callback);
		else throw new Error(`invalid hot.accept() usage.`);
	}
	acceptExports(_, callback) {
		this.acceptDeps([this.ownerPath], ([mod]) => callback?.(mod));
	}
	dispose(cb) {
		this.hmrClient.disposeMap.set(this.ownerPath, cb);
	}
	prune(cb) {
		this.hmrClient.pruneMap.set(this.ownerPath, cb);
	}
	decline() {}
	invalidate(message) {
		const firstInvalidatedBy = this.hmrClient.currentFirstInvalidatedBy ?? this.ownerPath;
		this.hmrClient.notifyListeners("vite:invalidate", {
			path: this.ownerPath,
			message,
			firstInvalidatedBy
		});
		this.send("vite:invalidate", {
			path: this.ownerPath,
			message,
			firstInvalidatedBy
		});
		this.hmrClient.logger.debug(`invalidate ${this.ownerPath}${message ? `: ${message}` : ""}`);
	}
	on(event, cb) {
		const addToMap = (map) => {
			const existing = map.get(event) || [];
			existing.push(cb);
			map.set(event, existing);
		};
		addToMap(this.hmrClient.customListenersMap);
		addToMap(this.newListeners);
	}
	off(event, cb) {
		const removeFromMap = (map) => {
			const existing = map.get(event);
			if (existing === void 0) return;
			const pruned = existing.filter((l) => l !== cb);
			if (pruned.length === 0) {
				map.delete(event);
				return;
			}
			map.set(event, pruned);
		};
		removeFromMap(this.hmrClient.customListenersMap);
		removeFromMap(this.newListeners);
	}
	send(event, data) {
		this.hmrClient.send({
			type: "custom",
			event,
			data
		});
	}
	acceptDeps(deps, callback = () => {}) {
		const mod = this.hmrClient.hotModulesMap.get(this.ownerPath) || {
			id: this.ownerPath,
			callbacks: []
		};
		mod.callbacks.push({
			deps,
			fn: callback
		});
		this.hmrClient.hotModulesMap.set(this.ownerPath, mod);
	}
};
var HMRClient = class {
	constructor(logger, transport$1, importUpdatedModule) {
		this.logger = logger;
		this.transport = transport$1;
		this.importUpdatedModule = importUpdatedModule;
		_defineProperty(this, "hotModulesMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "disposeMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "pruneMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "dataMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "customListenersMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "ctxToListenersMap", /* @__PURE__ */ new Map());
		_defineProperty(this, "currentFirstInvalidatedBy", void 0);
		_defineProperty(this, "updateQueue", []);
		_defineProperty(this, "pendingUpdateQueue", false);
	}
	async notifyListeners(event, data) {
		const cbs = this.customListenersMap.get(event);
		if (cbs) await Promise.allSettled(cbs.map((cb) => cb(data)));
	}
	send(payload) {
		this.transport.send(payload).catch((err) => {
			this.logger.error(err);
		});
	}
	clear() {
		this.hotModulesMap.clear();
		this.disposeMap.clear();
		this.pruneMap.clear();
		this.dataMap.clear();
		this.customListenersMap.clear();
		this.ctxToListenersMap.clear();
	}
	async prunePaths(paths) {
		await Promise.all(paths.map((path) => {
			const disposer = this.disposeMap.get(path);
			if (disposer) return disposer(this.dataMap.get(path));
		}));
		paths.forEach((path) => {
			const fn = this.pruneMap.get(path);
			if (fn) fn(this.dataMap.get(path));
		});
	}
	warnFailedUpdate(err, path) {
		if (!(err instanceof Error) || !err.message.includes("fetch")) this.logger.error(err);
		this.logger.error(`Failed to reload ${path}. This could be due to syntax errors or importing non-existent modules. (see errors above)`);
	}
	/**
	* buffer multiple hot updates triggered by the same src change
	* so that they are invoked in the same order they were sent.
	* (otherwise the order may be inconsistent because of the http request round trip)
	*/
	async queueUpdate(payload) {
		this.updateQueue.push(this.fetchUpdate(payload));
		if (!this.pendingUpdateQueue) {
			this.pendingUpdateQueue = true;
			await Promise.resolve();
			this.pendingUpdateQueue = false;
			const loading = [...this.updateQueue];
			this.updateQueue = [];
			(await Promise.all(loading)).forEach((fn) => fn && fn());
		}
	}
	async fetchUpdate(update) {
		const { path, acceptedPath, firstInvalidatedBy } = update;
		const mod = this.hotModulesMap.get(path);
		if (!mod) return;
		let fetchedModule;
		const isSelfUpdate = path === acceptedPath;
		const qualifiedCallbacks = mod.callbacks.filter(({ deps }) => deps.includes(acceptedPath));
		if (isSelfUpdate || qualifiedCallbacks.length > 0) {
			const disposer = this.disposeMap.get(acceptedPath);
			if (disposer) await disposer(this.dataMap.get(acceptedPath));
			try {
				fetchedModule = await this.importUpdatedModule(update);
			} catch (e) {
				this.warnFailedUpdate(e, acceptedPath);
			}
		}
		return () => {
			try {
				this.currentFirstInvalidatedBy = firstInvalidatedBy;
				for (const { deps, fn } of qualifiedCallbacks) fn(deps.map((dep) => dep === acceptedPath ? fetchedModule : void 0));
				const loggedPath = isSelfUpdate ? path : `${acceptedPath} via ${path}`;
				this.logger.debug(`hot updated: ${loggedPath}`);
			} finally {
				this.currentFirstInvalidatedBy = void 0;
			}
		};
	}
};

//#endregion
//#region ../../node_modules/.pnpm/nanoid@5.1.5/node_modules/nanoid/non-secure/index.js
let urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
let nanoid = (size = 21) => {
	let id = "";
	let i = size | 0;
	while (i--) id += urlAlphabet[Math.random() * 64 | 0];
	return id;
};

//#endregion
//#region src/shared/constants.ts
let SOURCEMAPPING_URL = "sourceMa";
SOURCEMAPPING_URL += "ppingURL";

//#endregion
//#region src/shared/utils.ts
const isWindows = typeof process !== "undefined" && process.platform === "win32";
const AsyncFunction = async function() {}.constructor;
function promiseWithResolvers() {
	let resolve;
	let reject;
	return {
		promise: new Promise((_resolve, _reject) => {
			resolve = _resolve;
			reject = _reject;
		}),
		resolve,
		reject
	};
}

//#endregion
//#region src/shared/moduleRunnerTransport.ts
function reviveInvokeError(e) {
	const error = new Error(e.message || "Unknown invoke error");
	Object.assign(error, e, { runnerError: /* @__PURE__ */ new Error("RunnerError") });
	return error;
}
const createInvokeableTransport = (transport$1) => {
	if (transport$1.invoke) return {
		...transport$1,
		async invoke(name, data) {
			const result = await transport$1.invoke({
				type: "custom",
				event: "vite:invoke",
				data: {
					id: "send",
					name,
					data
				}
			});
			if ("error" in result) throw reviveInvokeError(result.error);
			return result.result;
		}
	};
	if (!transport$1.send || !transport$1.connect) throw new Error("transport must implement send and connect when invoke is not implemented");
	const rpcPromises = /* @__PURE__ */ new Map();
	return {
		...transport$1,
		connect({ onMessage, onDisconnection }) {
			return transport$1.connect({
				onMessage(payload) {
					if (payload.type === "custom" && payload.event === "vite:invoke") {
						const data = payload.data;
						if (data.id.startsWith("response:")) {
							const invokeId = data.id.slice(9);
							const promise = rpcPromises.get(invokeId);
							if (!promise) return;
							if (promise.timeoutId) clearTimeout(promise.timeoutId);
							rpcPromises.delete(invokeId);
							const { error, result } = data.data;
							if (error) promise.reject(error);
							else promise.resolve(result);
							return;
						}
					}
					onMessage(payload);
				},
				onDisconnection
			});
		},
		disconnect() {
			rpcPromises.forEach((promise) => {
				promise.reject(/* @__PURE__ */ new Error(`transport was disconnected, cannot call ${JSON.stringify(promise.name)}`));
			});
			rpcPromises.clear();
			return transport$1.disconnect?.();
		},
		send(data) {
			return transport$1.send(data);
		},
		async invoke(name, data) {
			const promiseId = nanoid();
			const wrappedData = {
				type: "custom",
				event: "vite:invoke",
				data: {
					name,
					id: `send:${promiseId}`,
					data
				}
			};
			const sendPromise = transport$1.send(wrappedData);
			const { promise, resolve, reject } = promiseWithResolvers();
			const timeout = transport$1.timeout ?? 6e4;
			let timeoutId;
			if (timeout > 0) {
				timeoutId = setTimeout(() => {
					rpcPromises.delete(promiseId);
					reject(/* @__PURE__ */ new Error(`transport invoke timed out after ${timeout}ms (data: ${JSON.stringify(wrappedData)})`));
				}, timeout);
				timeoutId?.unref?.();
			}
			rpcPromises.set(promiseId, {
				resolve,
				reject,
				name,
				timeoutId
			});
			if (sendPromise) sendPromise.catch((err) => {
				clearTimeout(timeoutId);
				rpcPromises.delete(promiseId);
				reject(err);
			});
			try {
				return await promise;
			} catch (err) {
				throw reviveInvokeError(err);
			}
		}
	};
};
const normalizeModuleRunnerTransport = (transport$1) => {
	const invokeableTransport = createInvokeableTransport(transport$1);
	let isConnected = !invokeableTransport.connect;
	let connectingPromise;
	return {
		...transport$1,
		...invokeableTransport.connect ? { async connect(onMessage) {
			if (isConnected) return;
			if (connectingPromise) {
				await connectingPromise;
				return;
			}
			const maybePromise = invokeableTransport.connect({
				onMessage: onMessage ?? (() => {}),
				onDisconnection() {
					isConnected = false;
				}
			});
			if (maybePromise) {
				connectingPromise = maybePromise;
				await connectingPromise;
				connectingPromise = void 0;
			}
			isConnected = true;
		} } : {},
		...invokeableTransport.disconnect ? { async disconnect() {
			if (!isConnected) return;
			if (connectingPromise) await connectingPromise;
			isConnected = false;
			await invokeableTransport.disconnect();
		} } : {},
		async send(data) {
			if (!invokeableTransport.send) return;
			if (!isConnected) if (connectingPromise) await connectingPromise;
			else throw new Error("send was called before connect");
			await invokeableTransport.send(data);
		},
		async invoke(name, data) {
			if (!isConnected) if (connectingPromise) await connectingPromise;
			else throw new Error("invoke was called before connect");
			return invokeableTransport.invoke(name, data);
		}
	};
};
const createWebSocketModuleRunnerTransport = (options) => {
	const pingInterval = options.pingInterval ?? 3e4;
	let ws;
	let pingIntervalId;
	return {
		async connect({ onMessage, onDisconnection }) {
			const socket = options.createConnection();
			socket.addEventListener("message", async ({ data }) => {
				onMessage(JSON.parse(data));
			});
			let isOpened = socket.readyState === socket.OPEN;
			if (!isOpened) await new Promise((resolve, reject) => {
				socket.addEventListener("open", () => {
					isOpened = true;
					resolve();
				}, { once: true });
				socket.addEventListener("close", async () => {
					if (!isOpened) {
						reject(/* @__PURE__ */ new Error("WebSocket closed without opened."));
						return;
					}
					onMessage({
						type: "custom",
						event: "vite:ws:disconnect",
						data: { webSocket: socket }
					});
					onDisconnection();
				});
			});
			onMessage({
				type: "custom",
				event: "vite:ws:connect",
				data: { webSocket: socket }
			});
			ws = socket;
			pingIntervalId = setInterval(() => {
				if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ type: "ping" }));
			}, pingInterval);
		},
		disconnect() {
			clearInterval(pingIntervalId);
			ws?.close();
		},
		send(data) {
			ws.send(JSON.stringify(data));
		}
	};
};

//#endregion
//#region src/shared/hmrHandler.ts
function createHMRHandler(handler) {
	const queue = new Queue();
	return (payload) => queue.enqueue(() => handler(payload));
}
var Queue = class {
	constructor() {
		_defineProperty(this, "queue", []);
		_defineProperty(this, "pending", false);
	}
	enqueue(promise) {
		return new Promise((resolve, reject) => {
			this.queue.push({
				promise,
				resolve,
				reject
			});
			this.dequeue();
		});
	}
	dequeue() {
		if (this.pending) return false;
		const item = this.queue.shift();
		if (!item) return false;
		this.pending = true;
		item.promise().then(item.resolve).catch(item.reject).finally(() => {
			this.pending = false;
			this.dequeue();
		});
		return true;
	}
};

//#endregion
//#region src/client/overlay.ts
const hmrConfigName = "vite.config.ts";
const base$1 = "/Finance-app/" || "/";
function h(e, attrs = {}, ...children) {
	const elem = document.createElement(e);
	for (const [k, v] of Object.entries(attrs)) elem.setAttribute(k, v);
	elem.append(...children);
	return elem;
}
const templateStyle = `
:host {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 99999;
  --monospace: 'SFMono-Regular', Consolas,
  'Liberation Mono', Menlo, Courier, monospace;
  --red: #ff5555;
  --yellow: #e2aa53;
  --purple: #cfa4ff;
  --cyan: #2dd9da;
  --dim: #c9c9c9;

  --window-background: #181818;
  --window-color: #d8d8d8;
}

.backdrop {
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  margin: 0;
  background: rgba(0, 0, 0, 0.66);
}

.window {
  font-family: var(--monospace);
  line-height: 1.5;
  max-width: 80vw;
  color: var(--window-color);
  box-sizing: border-box;
  margin: 30px auto;
  padding: 2.5vh 4vw;
  position: relative;
  background: var(--window-background);
  border-radius: 6px 6px 8px 8px;
  box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);
  overflow: hidden;
  border-top: 8px solid var(--red);
  direction: ltr;
  text-align: left;
}

pre {
  font-family: var(--monospace);
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 1em;
  overflow-x: scroll;
  scrollbar-width: none;
}

pre::-webkit-scrollbar {
  display: none;
}

pre.frame::-webkit-scrollbar {
  display: block;
  height: 5px;
}

pre.frame::-webkit-scrollbar-thumb {
  background: #999;
  border-radius: 5px;
}

pre.frame {
  scrollbar-width: thin;
}

.message {
  line-height: 1.3;
  font-weight: 600;
  white-space: pre-wrap;
}

.message-body {
  color: var(--red);
}

.plugin {
  color: var(--purple);
}

.file {
  color: var(--cyan);
  margin-bottom: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.frame {
  color: var(--yellow);
}

.stack {
  font-size: 13px;
  color: var(--dim);
}

.tip {
  font-size: 13px;
  color: #999;
  border-top: 1px dotted #999;
  padding-top: 13px;
  line-height: 1.8;
}

code {
  font-size: 13px;
  font-family: var(--monospace);
  color: var(--yellow);
}

.file-link {
  text-decoration: underline;
  cursor: pointer;
}

kbd {
  line-height: 1.5;
  font-family: ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.75rem;
  font-weight: 700;
  background-color: rgb(38, 40, 44);
  color: rgb(166, 167, 171);
  padding: 0.15rem 0.3rem;
  border-radius: 0.25rem;
  border-width: 0.0625rem 0.0625rem 0.1875rem;
  border-style: solid;
  border-color: rgb(54, 57, 64);
  border-image: initial;
}
`;
const createTemplate = () => h("div", {
	class: "backdrop",
	part: "backdrop"
}, h("div", {
	class: "window",
	part: "window"
}, h("pre", {
	class: "message",
	part: "message"
}, h("span", {
	class: "plugin",
	part: "plugin"
}), h("span", {
	class: "message-body",
	part: "message-body"
})), h("pre", {
	class: "file",
	part: "file"
}), h("pre", {
	class: "frame",
	part: "frame"
}), h("pre", {
	class: "stack",
	part: "stack"
}), h("div", {
	class: "tip",
	part: "tip"
}, "Click outside, press ", h("kbd", {}, "Esc"), " key, or fix the code to dismiss.", h("br"), "You can also disable this overlay by setting ", h("code", { part: "config-option-name" }, "server.hmr.overlay"), " to ", h("code", { part: "config-option-value" }, "false"), " in ", h("code", { part: "config-file-name" }, hmrConfigName), ".")), h("style", {}, templateStyle));
const fileRE = /(?:file:\/\/)?(?:[a-zA-Z]:\\|\/).*?:\d+:\d+/g;
const codeframeRE = /^(?:>?\s*\d+\s+\|.*|\s+\|\s*\^.*)\r?\n/gm;
const { HTMLElement = class {} } = globalThis;
var ErrorOverlay = class extends HTMLElement {
	constructor(err, links = true) {
		super();
		_defineProperty(this, "root", void 0);
		_defineProperty(this, "closeOnEsc", void 0);
		this.root = this.attachShadow({ mode: "open" });
		this.root.appendChild(createTemplate());
		codeframeRE.lastIndex = 0;
		const hasFrame = err.frame && codeframeRE.test(err.frame);
		const message = hasFrame ? err.message.replace(codeframeRE, "") : err.message;
		if (err.plugin) this.text(".plugin", `[plugin:${err.plugin}] `);
		this.text(".message-body", message.trim());
		const [file] = (err.loc?.file || err.id || "unknown file").split(`?`);
		if (err.loc) this.text(".file", `${file}:${err.loc.line}:${err.loc.column}`, links);
		else if (err.id) this.text(".file", file);
		if (hasFrame) this.text(".frame", err.frame.trim());
		this.text(".stack", err.stack, links);
		this.root.querySelector(".window").addEventListener("click", (e) => {
			e.stopPropagation();
		});
		this.addEventListener("click", () => {
			this.close();
		});
		this.closeOnEsc = (e) => {
			if (e.key === "Escape" || e.code === "Escape") this.close();
		};
		document.addEventListener("keydown", this.closeOnEsc);
	}
	text(selector, text, linkFiles = false) {
		const el = this.root.querySelector(selector);
		if (!linkFiles) el.textContent = text;
		else {
			let curIndex = 0;
			let match;
			fileRE.lastIndex = 0;
			while (match = fileRE.exec(text)) {
				const { 0: file, index } = match;
				const frag = text.slice(curIndex, index);
				el.appendChild(document.createTextNode(frag));
				const link = document.createElement("a");
				link.textContent = file;
				link.className = "file-link";
				link.onclick = () => {
					fetch(new URL(`${base$1}__open-in-editor?file=${encodeURIComponent(file)}`, import.meta.url));
				};
				el.appendChild(link);
				curIndex += frag.length + file.length;
			}
			if (curIndex < text.length) el.appendChild(document.createTextNode(text.slice(curIndex)));
		}
	}
	close() {
		this.parentNode?.removeChild(this);
		document.removeEventListener("keydown", this.closeOnEsc);
	}
};
const overlayId = "vite-error-overlay";
const { customElements } = globalThis;
if (customElements && !customElements.get(overlayId)) customElements.define(overlayId, ErrorOverlay);

//#endregion
//#region src/client/client.ts
console.debug("[vite] connecting...");
const importMetaUrl = new URL(import.meta.url);
const serverHost = "localhost:5173/Finance-app/";
const socketProtocol = null || (importMetaUrl.protocol === "https:" ? "wss" : "ws");
const hmrPort = null;
const socketHost = `${null || importMetaUrl.hostname}:${hmrPort || importMetaUrl.port}${"/Finance-app/"}`;
const directSocketHost = "localhost:5173/Finance-app/";
const base = "/Finance-app/" || "/";
const hmrTimeout = 30000;
const wsToken = "IzIHzAuZJw8b";
const transport = normalizeModuleRunnerTransport((() => {
	let wsTransport = createWebSocketModuleRunnerTransport({
		createConnection: () => new WebSocket(`${socketProtocol}://${socketHost}?token=${wsToken}`, "vite-hmr"),
		pingInterval: hmrTimeout
	});
	return {
		async connect(handlers) {
			try {
				await wsTransport.connect(handlers);
			} catch (e) {
				if (!hmrPort) {
					wsTransport = createWebSocketModuleRunnerTransport({
						createConnection: () => new WebSocket(`${socketProtocol}://${directSocketHost}?token=${wsToken}`, "vite-hmr"),
						pingInterval: hmrTimeout
					});
					try {
						await wsTransport.connect(handlers);
						console.info("[vite] Direct websocket connection fallback. Check out https://vite.dev/config/server-options.html#server-hmr to remove the previous connection error.");
					} catch (e$1) {
						if (e$1 instanceof Error && e$1.message.includes("WebSocket closed without opened.")) {
							const currentScriptHostURL = new URL(import.meta.url);
							const currentScriptHost = currentScriptHostURL.host + currentScriptHostURL.pathname.replace(/@vite\/client$/, "");
							console.error(`[vite] failed to connect to websocket.
your current setup:
  (browser) ${currentScriptHost} <--[HTTP]--> ${serverHost} (server)\n  (browser) ${socketHost} <--[WebSocket (failing)]--> ${directSocketHost} (server)\nCheck out your Vite / network configuration and https://vite.dev/config/server-options.html#server-hmr .`);
						}
					}
					return;
				}
				console.error(`[vite] failed to connect to websocket (${e}). `);
				throw e;
			}
		},
		async disconnect() {
			await wsTransport.disconnect();
		},
		send(data) {
			wsTransport.send(data);
		}
	};
})());
let willUnload = false;
if (typeof window !== "undefined") window.addEventListener?.("beforeunload", () => {
	willUnload = true;
});
function cleanUrl(pathname) {
	const url = new URL(pathname, "http://vite.dev");
	url.searchParams.delete("direct");
	return url.pathname + url.search;
}
let isFirstUpdate = true;
const outdatedLinkTags = /* @__PURE__ */ new WeakSet();
const debounceReload = (time) => {
	let timer;
	return () => {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		timer = setTimeout(() => {
			location.reload();
		}, time);
	};
};
const pageReload = debounceReload(20);
const hmrClient = new HMRClient({
	error: (err) => console.error("[vite]", err),
	debug: (...msg) => console.debug("[vite]", ...msg)
}, transport, async function importUpdatedModule({ acceptedPath, timestamp, explicitImportRequired, isWithinCircularImport }) {
	const [acceptedPathWithoutQuery, query] = acceptedPath.split(`?`);
	const importPromise = import(
		/* @vite-ignore */
		base + acceptedPathWithoutQuery.slice(1) + `?${explicitImportRequired ? "import&" : ""}t=${timestamp}${query ? `&${query}` : ""}`
);
	if (isWithinCircularImport) importPromise.catch(() => {
		console.info(`[hmr] ${acceptedPath} failed to apply HMR as it's within a circular import. Reloading page to reset the execution order. To debug and break the circular import, you can run \`vite --debug hmr\` to log the circular dependency path if a file change triggered it.`);
		pageReload();
	});
	return await importPromise;
});
transport.connect(createHMRHandler(handleMessage));
async function handleMessage(payload) {
	switch (payload.type) {
		case "connected":
			console.debug(`[vite] connected.`);
			break;
		case "update":
			await hmrClient.notifyListeners("vite:beforeUpdate", payload);
			if (hasDocument) if (isFirstUpdate && hasErrorOverlay()) {
				location.reload();
				return;
			} else {
				if (enableOverlay) clearErrorOverlay();
				isFirstUpdate = false;
			}
			await Promise.all(payload.updates.map(async (update) => {
				if (update.type === "js-update") return hmrClient.queueUpdate(update);
				const { path, timestamp } = update;
				const searchUrl = cleanUrl(path);
				const el = Array.from(document.querySelectorAll("link")).find((e) => !outdatedLinkTags.has(e) && cleanUrl(e.href).includes(searchUrl));
				if (!el) return;
				const newPath = `${base}${searchUrl.slice(1)}${searchUrl.includes("?") ? "&" : "?"}t=${timestamp}`;
				return new Promise((resolve) => {
					const newLinkTag = el.cloneNode();
					newLinkTag.href = new URL(newPath, el.href).href;
					const removeOldEl = () => {
						el.remove();
						console.debug(`[vite] css hot updated: ${searchUrl}`);
						resolve();
					};
					newLinkTag.addEventListener("load", removeOldEl);
					newLinkTag.addEventListener("error", removeOldEl);
					outdatedLinkTags.add(el);
					el.after(newLinkTag);
				});
			}));
			await hmrClient.notifyListeners("vite:afterUpdate", payload);
			break;
		case "custom":
			await hmrClient.notifyListeners(payload.event, payload.data);
			if (payload.event === "vite:ws:disconnect") {
				if (hasDocument && !willUnload) {
					console.log(`[vite] server connection lost. Polling for restart...`);
					const socket = payload.data.webSocket;
					const url = new URL(socket.url);
					url.search = "";
					await waitForSuccessfulPing(url.href);
					location.reload();
				}
			}
			break;
		case "full-reload":
			await hmrClient.notifyListeners("vite:beforeFullReload", payload);
			if (hasDocument) if (payload.path && payload.path.endsWith(".html")) {
				const pagePath = decodeURI(location.pathname);
				const payloadPath = base + payload.path.slice(1);
				if (pagePath === payloadPath || payload.path === "/index.html" || pagePath.endsWith("/") && pagePath + "index.html" === payloadPath) pageReload();
				return;
			} else pageReload();
			break;
		case "prune":
			await hmrClient.notifyListeners("vite:beforePrune", payload);
			await hmrClient.prunePaths(payload.paths);
			break;
		case "error":
			await hmrClient.notifyListeners("vite:error", payload);
			if (hasDocument) {
				const err = payload.err;
				if (enableOverlay) createErrorOverlay(err);
				else console.error(`[vite] Internal Server Error\n${err.message}\n${err.stack}`);
			}
			break;
		case "ping": break;
		default: return payload;
	}
}
const enableOverlay = true;
const hasDocument = "document" in globalThis;
function createErrorOverlay(err) {
	clearErrorOverlay();
	const { customElements: customElements$1 } = globalThis;
	if (customElements$1) {
		const ErrorOverlayConstructor = customElements$1.get(overlayId);
		document.body.appendChild(new ErrorOverlayConstructor(err));
	}
}
function clearErrorOverlay() {
	document.querySelectorAll(overlayId).forEach((n) => n.close());
}
function hasErrorOverlay() {
	return document.querySelectorAll(overlayId).length;
}
function waitForSuccessfulPing(socketUrl) {
	if (typeof SharedWorker === "undefined") {
		const visibilityManager = {
			currentState: document.visibilityState,
			listeners: /* @__PURE__ */ new Set()
		};
		const onVisibilityChange = () => {
			visibilityManager.currentState = document.visibilityState;
			for (const listener of visibilityManager.listeners) listener(visibilityManager.currentState);
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return waitForSuccessfulPingInternal(socketUrl, visibilityManager);
	}
	const blob = new Blob([
		"\"use strict\";",
		`const waitForSuccessfulPingInternal = ${waitForSuccessfulPingInternal.toString()};`,
		`const fn = ${pingWorkerContentMain.toString()};`,
		`fn(${JSON.stringify(socketUrl)})`
	], { type: "application/javascript" });
	const objURL = URL.createObjectURL(blob);
	const sharedWorker = new SharedWorker(objURL);
	return new Promise((resolve, reject) => {
		const onVisibilityChange = () => {
			sharedWorker.port.postMessage({ visibility: document.visibilityState });
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		sharedWorker.port.addEventListener("message", (event) => {
			document.removeEventListener("visibilitychange", onVisibilityChange);
			sharedWorker.port.close();
			const data = event.data;
			if (data.type === "error") {
				reject(data.error);
				return;
			}
			resolve();
		});
		onVisibilityChange();
		sharedWorker.port.start();
	});
}
function pingWorkerContentMain(socketUrl) {
	self.addEventListener("connect", (_event) => {
		const port = _event.ports[0];
		if (!socketUrl) {
			port.postMessage({
				type: "error",
				error: /* @__PURE__ */ new Error("socketUrl not found")
			});
			return;
		}
		const visibilityManager = {
			currentState: "visible",
			listeners: /* @__PURE__ */ new Set()
		};
		port.addEventListener("message", (event) => {
			const { visibility } = event.data;
			visibilityManager.currentState = visibility;
			console.debug("[vite] new window visibility", visibility);
			for (const listener of visibilityManager.listeners) listener(visibility);
		});
		port.start();
		console.debug("[vite] connected from window");
		waitForSuccessfulPingInternal(socketUrl, visibilityManager).then(() => {
			console.debug("[vite] ping successful");
			try {
				port.postMessage({ type: "success" });
			} catch (error) {
				port.postMessage({
					type: "error",
					error
				});
			}
		}, (error) => {
			console.debug("[vite] error happened", error);
			try {
				port.postMessage({
					type: "error",
					error
				});
			} catch (error$1) {
				port.postMessage({
					type: "error",
					error: error$1
				});
			}
		});
	});
}
async function waitForSuccessfulPingInternal(socketUrl, visibilityManager, ms = 1e3) {
	function wait(ms$1) {
		return new Promise((resolve) => setTimeout(resolve, ms$1));
	}
	async function ping() {
		try {
			const socket = new WebSocket(socketUrl, "vite-ping");
			return new Promise((resolve) => {
				function onOpen() {
					resolve(true);
					close();
				}
				function onError() {
					resolve(false);
					close();
				}
				function close() {
					socket.removeEventListener("open", onOpen);
					socket.removeEventListener("error", onError);
					socket.close();
				}
				socket.addEventListener("open", onOpen);
				socket.addEventListener("error", onError);
			});
		} catch {
			return false;
		}
	}
	function waitForWindowShow(visibilityManager$1) {
		return new Promise((resolve) => {
			const onChange = (newVisibility) => {
				if (newVisibility === "visible") {
					resolve();
					visibilityManager$1.listeners.delete(onChange);
				}
			};
			visibilityManager$1.listeners.add(onChange);
		});
	}
	if (await ping()) return;
	await wait(ms);
	while (true) if (visibilityManager.currentState === "visible") {
		if (await ping()) break;
		await wait(ms);
	} else await waitForWindowShow(visibilityManager);
}
const sheetsMap = /* @__PURE__ */ new Map();
if ("document" in globalThis) document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
	sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
});
const cspNonce = "document" in globalThis ? document.querySelector("meta[property=csp-nonce]")?.nonce : void 0;
let lastInsertedStyle;
function updateStyle(id, content) {
	let style = sheetsMap.get(id);
	if (!style) {
		style = document.createElement("style");
		style.setAttribute("type", "text/css");
		style.setAttribute("data-vite-dev-id", id);
		style.textContent = content;
		if (cspNonce) style.setAttribute("nonce", cspNonce);
		if (!lastInsertedStyle) {
			document.head.appendChild(style);
			setTimeout(() => {
				lastInsertedStyle = void 0;
			}, 0);
		} else lastInsertedStyle.insertAdjacentElement("afterend", style);
		lastInsertedStyle = style;
	} else style.textContent = content;
	sheetsMap.set(id, style);
}
function removeStyle(id) {
	const style = sheetsMap.get(id);
	if (style) {
		document.head.removeChild(style);
		sheetsMap.delete(id);
	}
}
function createHotContext(ownerPath) {
	return new HMRContext(hmrClient, ownerPath);
}
/**
* urls here are dynamic import() urls that couldn't be statically analyzed
*/
function injectQuery(url, queryToInject) {
	if (url[0] !== "." && url[0] !== "/") return url;
	const pathname = url.replace(/[?#].*$/, "");
	const { search, hash } = new URL(url, "http://vite.dev");
	return `${pathname}?${queryToInject}${search ? `&` + search.slice(1) : ""}${hash || ""}`;
}

//#endregion
export { ErrorOverlay, createHotContext, injectQuery, removeStyle, updateStyle };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsaWVudCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXCIvRmluYW5jZS1hcHAvbm9kZV9tb2R1bGVzL3ZpdGUvZGlzdC9jbGllbnQvZW52Lm1qc1wiO1xuXG4vLyNyZWdpb24gLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0BveGMtcHJvamVjdCtydW50aW1lQDAuODcuMC9ub2RlX21vZHVsZXMvQG94Yy1wcm9qZWN0L3J1bnRpbWUvc3JjL2hlbHBlcnMvZXNtL3R5cGVvZi5qc1xuZnVuY3Rpb24gX3R5cGVvZihvKSB7XG5cdFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjtcblx0cmV0dXJuIF90eXBlb2YgPSBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIFN5bWJvbCAmJiBcInN5bWJvbFwiID09IHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPyBmdW5jdGlvbihvJDEpIHtcblx0XHRyZXR1cm4gdHlwZW9mIG8kMTtcblx0fSA6IGZ1bmN0aW9uKG8kMSkge1xuXHRcdHJldHVybiBvJDEgJiYgXCJmdW5jdGlvblwiID09IHR5cGVvZiBTeW1ib2wgJiYgbyQxLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgbyQxICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvJDE7XG5cdH0sIF90eXBlb2Yobyk7XG59XG5cbi8vI2VuZHJlZ2lvblxuLy8jcmVnaW9uIC4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9Ab3hjLXByb2plY3QrcnVudGltZUAwLjg3LjAvbm9kZV9tb2R1bGVzL0BveGMtcHJvamVjdC9ydW50aW1lL3NyYy9oZWxwZXJzL2VzbS90b1ByaW1pdGl2ZS5qc1xuZnVuY3Rpb24gdG9QcmltaXRpdmUodCwgcikge1xuXHRpZiAoXCJvYmplY3RcIiAhPSBfdHlwZW9mKHQpIHx8ICF0KSByZXR1cm4gdDtcblx0dmFyIGUgPSB0W1N5bWJvbC50b1ByaW1pdGl2ZV07XG5cdGlmICh2b2lkIDAgIT09IGUpIHtcblx0XHR2YXIgaSA9IGUuY2FsbCh0LCByIHx8IFwiZGVmYXVsdFwiKTtcblx0XHRpZiAoXCJvYmplY3RcIiAhPSBfdHlwZW9mKGkpKSByZXR1cm4gaTtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKFwiQEB0b1ByaW1pdGl2ZSBtdXN0IHJldHVybiBhIHByaW1pdGl2ZSB2YWx1ZS5cIik7XG5cdH1cblx0cmV0dXJuIChcInN0cmluZ1wiID09PSByID8gU3RyaW5nIDogTnVtYmVyKSh0KTtcbn1cblxuLy8jZW5kcmVnaW9uXG4vLyNyZWdpb24gLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0BveGMtcHJvamVjdCtydW50aW1lQDAuODcuMC9ub2RlX21vZHVsZXMvQG94Yy1wcm9qZWN0L3J1bnRpbWUvc3JjL2hlbHBlcnMvZXNtL3RvUHJvcGVydHlLZXkuanNcbmZ1bmN0aW9uIHRvUHJvcGVydHlLZXkodCkge1xuXHR2YXIgaSA9IHRvUHJpbWl0aXZlKHQsIFwic3RyaW5nXCIpO1xuXHRyZXR1cm4gXCJzeW1ib2xcIiA9PSBfdHlwZW9mKGkpID8gaSA6IGkgKyBcIlwiO1xufVxuXG4vLyNlbmRyZWdpb25cbi8vI3JlZ2lvbiAuLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vQG94Yy1wcm9qZWN0K3J1bnRpbWVAMC44Ny4wL25vZGVfbW9kdWxlcy9Ab3hjLXByb2plY3QvcnVudGltZS9zcmMvaGVscGVycy9lc20vZGVmaW5lUHJvcGVydHkuanNcbmZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0eShlLCByLCB0KSB7XG5cdHJldHVybiAociA9IHRvUHJvcGVydHlLZXkocikpIGluIGUgPyBPYmplY3QuZGVmaW5lUHJvcGVydHkoZSwgciwge1xuXHRcdHZhbHVlOiB0LFxuXHRcdGVudW1lcmFibGU6ICEwLFxuXHRcdGNvbmZpZ3VyYWJsZTogITAsXG5cdFx0d3JpdGFibGU6ICEwXG5cdH0pIDogZVtyXSA9IHQsIGU7XG59XG5cbi8vI2VuZHJlZ2lvblxuLy8jcmVnaW9uIHNyYy9zaGFyZWQvaG1yLnRzXG52YXIgSE1SQ29udGV4dCA9IGNsYXNzIHtcblx0Y29uc3RydWN0b3IoaG1yQ2xpZW50JDEsIG93bmVyUGF0aCkge1xuXHRcdHRoaXMuaG1yQ2xpZW50ID0gaG1yQ2xpZW50JDE7XG5cdFx0dGhpcy5vd25lclBhdGggPSBvd25lclBhdGg7XG5cdFx0X2RlZmluZVByb3BlcnR5KHRoaXMsIFwibmV3TGlzdGVuZXJzXCIsIHZvaWQgMCk7XG5cdFx0aWYgKCFobXJDbGllbnQkMS5kYXRhTWFwLmhhcyhvd25lclBhdGgpKSBobXJDbGllbnQkMS5kYXRhTWFwLnNldChvd25lclBhdGgsIHt9KTtcblx0XHRjb25zdCBtb2QgPSBobXJDbGllbnQkMS5ob3RNb2R1bGVzTWFwLmdldChvd25lclBhdGgpO1xuXHRcdGlmIChtb2QpIG1vZC5jYWxsYmFja3MgPSBbXTtcblx0XHRjb25zdCBzdGFsZUxpc3RlbmVycyA9IGhtckNsaWVudCQxLmN0eFRvTGlzdGVuZXJzTWFwLmdldChvd25lclBhdGgpO1xuXHRcdGlmIChzdGFsZUxpc3RlbmVycykgZm9yIChjb25zdCBbZXZlbnQsIHN0YWxlRm5zXSBvZiBzdGFsZUxpc3RlbmVycykge1xuXHRcdFx0Y29uc3QgbGlzdGVuZXJzID0gaG1yQ2xpZW50JDEuY3VzdG9tTGlzdGVuZXJzTWFwLmdldChldmVudCk7XG5cdFx0XHRpZiAobGlzdGVuZXJzKSBobXJDbGllbnQkMS5jdXN0b21MaXN0ZW5lcnNNYXAuc2V0KGV2ZW50LCBsaXN0ZW5lcnMuZmlsdGVyKChsKSA9PiAhc3RhbGVGbnMuaW5jbHVkZXMobCkpKTtcblx0XHR9XG5cdFx0dGhpcy5uZXdMaXN0ZW5lcnMgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuXHRcdGhtckNsaWVudCQxLmN0eFRvTGlzdGVuZXJzTWFwLnNldChvd25lclBhdGgsIHRoaXMubmV3TGlzdGVuZXJzKTtcblx0fVxuXHRnZXQgZGF0YSgpIHtcblx0XHRyZXR1cm4gdGhpcy5obXJDbGllbnQuZGF0YU1hcC5nZXQodGhpcy5vd25lclBhdGgpO1xuXHR9XG5cdGFjY2VwdChkZXBzLCBjYWxsYmFjaykge1xuXHRcdGlmICh0eXBlb2YgZGVwcyA9PT0gXCJmdW5jdGlvblwiIHx8ICFkZXBzKSB0aGlzLmFjY2VwdERlcHMoW3RoaXMub3duZXJQYXRoXSwgKFttb2RdKSA9PiBkZXBzPy4obW9kKSk7XG5cdFx0ZWxzZSBpZiAodHlwZW9mIGRlcHMgPT09IFwic3RyaW5nXCIpIHRoaXMuYWNjZXB0RGVwcyhbZGVwc10sIChbbW9kXSkgPT4gY2FsbGJhY2s/Lihtb2QpKTtcblx0XHRlbHNlIGlmIChBcnJheS5pc0FycmF5KGRlcHMpKSB0aGlzLmFjY2VwdERlcHMoZGVwcywgY2FsbGJhY2spO1xuXHRcdGVsc2UgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIGhvdC5hY2NlcHQoKSB1c2FnZS5gKTtcblx0fVxuXHRhY2NlcHRFeHBvcnRzKF8sIGNhbGxiYWNrKSB7XG5cdFx0dGhpcy5hY2NlcHREZXBzKFt0aGlzLm93bmVyUGF0aF0sIChbbW9kXSkgPT4gY2FsbGJhY2s/Lihtb2QpKTtcblx0fVxuXHRkaXNwb3NlKGNiKSB7XG5cdFx0dGhpcy5obXJDbGllbnQuZGlzcG9zZU1hcC5zZXQodGhpcy5vd25lclBhdGgsIGNiKTtcblx0fVxuXHRwcnVuZShjYikge1xuXHRcdHRoaXMuaG1yQ2xpZW50LnBydW5lTWFwLnNldCh0aGlzLm93bmVyUGF0aCwgY2IpO1xuXHR9XG5cdGRlY2xpbmUoKSB7fVxuXHRpbnZhbGlkYXRlKG1lc3NhZ2UpIHtcblx0XHRjb25zdCBmaXJzdEludmFsaWRhdGVkQnkgPSB0aGlzLmhtckNsaWVudC5jdXJyZW50Rmlyc3RJbnZhbGlkYXRlZEJ5ID8/IHRoaXMub3duZXJQYXRoO1xuXHRcdHRoaXMuaG1yQ2xpZW50Lm5vdGlmeUxpc3RlbmVycyhcInZpdGU6aW52YWxpZGF0ZVwiLCB7XG5cdFx0XHRwYXRoOiB0aGlzLm93bmVyUGF0aCxcblx0XHRcdG1lc3NhZ2UsXG5cdFx0XHRmaXJzdEludmFsaWRhdGVkQnlcblx0XHR9KTtcblx0XHR0aGlzLnNlbmQoXCJ2aXRlOmludmFsaWRhdGVcIiwge1xuXHRcdFx0cGF0aDogdGhpcy5vd25lclBhdGgsXG5cdFx0XHRtZXNzYWdlLFxuXHRcdFx0Zmlyc3RJbnZhbGlkYXRlZEJ5XG5cdFx0fSk7XG5cdFx0dGhpcy5obXJDbGllbnQubG9nZ2VyLmRlYnVnKGBpbnZhbGlkYXRlICR7dGhpcy5vd25lclBhdGh9JHttZXNzYWdlID8gYDogJHttZXNzYWdlfWAgOiBcIlwifWApO1xuXHR9XG5cdG9uKGV2ZW50LCBjYikge1xuXHRcdGNvbnN0IGFkZFRvTWFwID0gKG1hcCkgPT4ge1xuXHRcdFx0Y29uc3QgZXhpc3RpbmcgPSBtYXAuZ2V0KGV2ZW50KSB8fCBbXTtcblx0XHRcdGV4aXN0aW5nLnB1c2goY2IpO1xuXHRcdFx0bWFwLnNldChldmVudCwgZXhpc3RpbmcpO1xuXHRcdH07XG5cdFx0YWRkVG9NYXAodGhpcy5obXJDbGllbnQuY3VzdG9tTGlzdGVuZXJzTWFwKTtcblx0XHRhZGRUb01hcCh0aGlzLm5ld0xpc3RlbmVycyk7XG5cdH1cblx0b2ZmKGV2ZW50LCBjYikge1xuXHRcdGNvbnN0IHJlbW92ZUZyb21NYXAgPSAobWFwKSA9PiB7XG5cdFx0XHRjb25zdCBleGlzdGluZyA9IG1hcC5nZXQoZXZlbnQpO1xuXHRcdFx0aWYgKGV4aXN0aW5nID09PSB2b2lkIDApIHJldHVybjtcblx0XHRcdGNvbnN0IHBydW5lZCA9IGV4aXN0aW5nLmZpbHRlcigobCkgPT4gbCAhPT0gY2IpO1xuXHRcdFx0aWYgKHBydW5lZC5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0bWFwLmRlbGV0ZShldmVudCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdG1hcC5zZXQoZXZlbnQsIHBydW5lZCk7XG5cdFx0fTtcblx0XHRyZW1vdmVGcm9tTWFwKHRoaXMuaG1yQ2xpZW50LmN1c3RvbUxpc3RlbmVyc01hcCk7XG5cdFx0cmVtb3ZlRnJvbU1hcCh0aGlzLm5ld0xpc3RlbmVycyk7XG5cdH1cblx0c2VuZChldmVudCwgZGF0YSkge1xuXHRcdHRoaXMuaG1yQ2xpZW50LnNlbmQoe1xuXHRcdFx0dHlwZTogXCJjdXN0b21cIixcblx0XHRcdGV2ZW50LFxuXHRcdFx0ZGF0YVxuXHRcdH0pO1xuXHR9XG5cdGFjY2VwdERlcHMoZGVwcywgY2FsbGJhY2sgPSAoKSA9PiB7fSkge1xuXHRcdGNvbnN0IG1vZCA9IHRoaXMuaG1yQ2xpZW50LmhvdE1vZHVsZXNNYXAuZ2V0KHRoaXMub3duZXJQYXRoKSB8fCB7XG5cdFx0XHRpZDogdGhpcy5vd25lclBhdGgsXG5cdFx0XHRjYWxsYmFja3M6IFtdXG5cdFx0fTtcblx0XHRtb2QuY2FsbGJhY2tzLnB1c2goe1xuXHRcdFx0ZGVwcyxcblx0XHRcdGZuOiBjYWxsYmFja1xuXHRcdH0pO1xuXHRcdHRoaXMuaG1yQ2xpZW50LmhvdE1vZHVsZXNNYXAuc2V0KHRoaXMub3duZXJQYXRoLCBtb2QpO1xuXHR9XG59O1xudmFyIEhNUkNsaWVudCA9IGNsYXNzIHtcblx0Y29uc3RydWN0b3IobG9nZ2VyLCB0cmFuc3BvcnQkMSwgaW1wb3J0VXBkYXRlZE1vZHVsZSkge1xuXHRcdHRoaXMubG9nZ2VyID0gbG9nZ2VyO1xuXHRcdHRoaXMudHJhbnNwb3J0ID0gdHJhbnNwb3J0JDE7XG5cdFx0dGhpcy5pbXBvcnRVcGRhdGVkTW9kdWxlID0gaW1wb3J0VXBkYXRlZE1vZHVsZTtcblx0XHRfZGVmaW5lUHJvcGVydHkodGhpcywgXCJob3RNb2R1bGVzTWFwXCIsIC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCkpO1xuXHRcdF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImRpc3Bvc2VNYXBcIiwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSk7XG5cdFx0X2RlZmluZVByb3BlcnR5KHRoaXMsIFwicHJ1bmVNYXBcIiwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSk7XG5cdFx0X2RlZmluZVByb3BlcnR5KHRoaXMsIFwiZGF0YU1hcFwiLCAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpKTtcblx0XHRfZGVmaW5lUHJvcGVydHkodGhpcywgXCJjdXN0b21MaXN0ZW5lcnNNYXBcIiwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSk7XG5cdFx0X2RlZmluZVByb3BlcnR5KHRoaXMsIFwiY3R4VG9MaXN0ZW5lcnNNYXBcIiwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSk7XG5cdFx0X2RlZmluZVByb3BlcnR5KHRoaXMsIFwiY3VycmVudEZpcnN0SW52YWxpZGF0ZWRCeVwiLCB2b2lkIDApO1xuXHRcdF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInVwZGF0ZVF1ZXVlXCIsIFtdKTtcblx0XHRfZGVmaW5lUHJvcGVydHkodGhpcywgXCJwZW5kaW5nVXBkYXRlUXVldWVcIiwgZmFsc2UpO1xuXHR9XG5cdGFzeW5jIG5vdGlmeUxpc3RlbmVycyhldmVudCwgZGF0YSkge1xuXHRcdGNvbnN0IGNicyA9IHRoaXMuY3VzdG9tTGlzdGVuZXJzTWFwLmdldChldmVudCk7XG5cdFx0aWYgKGNicykgYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKGNicy5tYXAoKGNiKSA9PiBjYihkYXRhKSkpO1xuXHR9XG5cdHNlbmQocGF5bG9hZCkge1xuXHRcdHRoaXMudHJhbnNwb3J0LnNlbmQocGF5bG9hZCkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoZXJyKTtcblx0XHR9KTtcblx0fVxuXHRjbGVhcigpIHtcblx0XHR0aGlzLmhvdE1vZHVsZXNNYXAuY2xlYXIoKTtcblx0XHR0aGlzLmRpc3Bvc2VNYXAuY2xlYXIoKTtcblx0XHR0aGlzLnBydW5lTWFwLmNsZWFyKCk7XG5cdFx0dGhpcy5kYXRhTWFwLmNsZWFyKCk7XG5cdFx0dGhpcy5jdXN0b21MaXN0ZW5lcnNNYXAuY2xlYXIoKTtcblx0XHR0aGlzLmN0eFRvTGlzdGVuZXJzTWFwLmNsZWFyKCk7XG5cdH1cblx0YXN5bmMgcHJ1bmVQYXRocyhwYXRocykge1xuXHRcdGF3YWl0IFByb21pc2UuYWxsKHBhdGhzLm1hcCgocGF0aCkgPT4ge1xuXHRcdFx0Y29uc3QgZGlzcG9zZXIgPSB0aGlzLmRpc3Bvc2VNYXAuZ2V0KHBhdGgpO1xuXHRcdFx0aWYgKGRpc3Bvc2VyKSByZXR1cm4gZGlzcG9zZXIodGhpcy5kYXRhTWFwLmdldChwYXRoKSk7XG5cdFx0fSkpO1xuXHRcdHBhdGhzLmZvckVhY2goKHBhdGgpID0+IHtcblx0XHRcdGNvbnN0IGZuID0gdGhpcy5wcnVuZU1hcC5nZXQocGF0aCk7XG5cdFx0XHRpZiAoZm4pIGZuKHRoaXMuZGF0YU1hcC5nZXQocGF0aCkpO1xuXHRcdH0pO1xuXHR9XG5cdHdhcm5GYWlsZWRVcGRhdGUoZXJyLCBwYXRoKSB7XG5cdFx0aWYgKCEoZXJyIGluc3RhbmNlb2YgRXJyb3IpIHx8ICFlcnIubWVzc2FnZS5pbmNsdWRlcyhcImZldGNoXCIpKSB0aGlzLmxvZ2dlci5lcnJvcihlcnIpO1xuXHRcdHRoaXMubG9nZ2VyLmVycm9yKGBGYWlsZWQgdG8gcmVsb2FkICR7cGF0aH0uIFRoaXMgY291bGQgYmUgZHVlIHRvIHN5bnRheCBlcnJvcnMgb3IgaW1wb3J0aW5nIG5vbi1leGlzdGVudCBtb2R1bGVzLiAoc2VlIGVycm9ycyBhYm92ZSlgKTtcblx0fVxuXHQvKipcblx0KiBidWZmZXIgbXVsdGlwbGUgaG90IHVwZGF0ZXMgdHJpZ2dlcmVkIGJ5IHRoZSBzYW1lIHNyYyBjaGFuZ2Vcblx0KiBzbyB0aGF0IHRoZXkgYXJlIGludm9rZWQgaW4gdGhlIHNhbWUgb3JkZXIgdGhleSB3ZXJlIHNlbnQuXG5cdCogKG90aGVyd2lzZSB0aGUgb3JkZXIgbWF5IGJlIGluY29uc2lzdGVudCBiZWNhdXNlIG9mIHRoZSBodHRwIHJlcXVlc3Qgcm91bmQgdHJpcClcblx0Ki9cblx0YXN5bmMgcXVldWVVcGRhdGUocGF5bG9hZCkge1xuXHRcdHRoaXMudXBkYXRlUXVldWUucHVzaCh0aGlzLmZldGNoVXBkYXRlKHBheWxvYWQpKTtcblx0XHRpZiAoIXRoaXMucGVuZGluZ1VwZGF0ZVF1ZXVlKSB7XG5cdFx0XHR0aGlzLnBlbmRpbmdVcGRhdGVRdWV1ZSA9IHRydWU7XG5cdFx0XHRhd2FpdCBQcm9taXNlLnJlc29sdmUoKTtcblx0XHRcdHRoaXMucGVuZGluZ1VwZGF0ZVF1ZXVlID0gZmFsc2U7XG5cdFx0XHRjb25zdCBsb2FkaW5nID0gWy4uLnRoaXMudXBkYXRlUXVldWVdO1xuXHRcdFx0dGhpcy51cGRhdGVRdWV1ZSA9IFtdO1xuXHRcdFx0KGF3YWl0IFByb21pc2UuYWxsKGxvYWRpbmcpKS5mb3JFYWNoKChmbikgPT4gZm4gJiYgZm4oKSk7XG5cdFx0fVxuXHR9XG5cdGFzeW5jIGZldGNoVXBkYXRlKHVwZGF0ZSkge1xuXHRcdGNvbnN0IHsgcGF0aCwgYWNjZXB0ZWRQYXRoLCBmaXJzdEludmFsaWRhdGVkQnkgfSA9IHVwZGF0ZTtcblx0XHRjb25zdCBtb2QgPSB0aGlzLmhvdE1vZHVsZXNNYXAuZ2V0KHBhdGgpO1xuXHRcdGlmICghbW9kKSByZXR1cm47XG5cdFx0bGV0IGZldGNoZWRNb2R1bGU7XG5cdFx0Y29uc3QgaXNTZWxmVXBkYXRlID0gcGF0aCA9PT0gYWNjZXB0ZWRQYXRoO1xuXHRcdGNvbnN0IHF1YWxpZmllZENhbGxiYWNrcyA9IG1vZC5jYWxsYmFja3MuZmlsdGVyKCh7IGRlcHMgfSkgPT4gZGVwcy5pbmNsdWRlcyhhY2NlcHRlZFBhdGgpKTtcblx0XHRpZiAoaXNTZWxmVXBkYXRlIHx8IHF1YWxpZmllZENhbGxiYWNrcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRjb25zdCBkaXNwb3NlciA9IHRoaXMuZGlzcG9zZU1hcC5nZXQoYWNjZXB0ZWRQYXRoKTtcblx0XHRcdGlmIChkaXNwb3NlcikgYXdhaXQgZGlzcG9zZXIodGhpcy5kYXRhTWFwLmdldChhY2NlcHRlZFBhdGgpKTtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGZldGNoZWRNb2R1bGUgPSBhd2FpdCB0aGlzLmltcG9ydFVwZGF0ZWRNb2R1bGUodXBkYXRlKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0dGhpcy53YXJuRmFpbGVkVXBkYXRlKGUsIGFjY2VwdGVkUGF0aCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAoKSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRGaXJzdEludmFsaWRhdGVkQnkgPSBmaXJzdEludmFsaWRhdGVkQnk7XG5cdFx0XHRcdGZvciAoY29uc3QgeyBkZXBzLCBmbiB9IG9mIHF1YWxpZmllZENhbGxiYWNrcykgZm4oZGVwcy5tYXAoKGRlcCkgPT4gZGVwID09PSBhY2NlcHRlZFBhdGggPyBmZXRjaGVkTW9kdWxlIDogdm9pZCAwKSk7XG5cdFx0XHRcdGNvbnN0IGxvZ2dlZFBhdGggPSBpc1NlbGZVcGRhdGUgPyBwYXRoIDogYCR7YWNjZXB0ZWRQYXRofSB2aWEgJHtwYXRofWA7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKGBob3QgdXBkYXRlZDogJHtsb2dnZWRQYXRofWApO1xuXHRcdFx0fSBmaW5hbGx5IHtcblx0XHRcdFx0dGhpcy5jdXJyZW50Rmlyc3RJbnZhbGlkYXRlZEJ5ID0gdm9pZCAwO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbn07XG5cbi8vI2VuZHJlZ2lvblxuLy8jcmVnaW9uIC4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9uYW5vaWRANS4xLjUvbm9kZV9tb2R1bGVzL25hbm9pZC9ub24tc2VjdXJlL2luZGV4LmpzXG5sZXQgdXJsQWxwaGFiZXQgPSBcInVzZWFuZG9tLTI2VDE5ODM0MFBYNzVweEpBQ0tWRVJZTUlOREJVU0hXT0xGX0dRWmJmZ2hqa2xxdnd5enJpY3RcIjtcbmxldCBuYW5vaWQgPSAoc2l6ZSA9IDIxKSA9PiB7XG5cdGxldCBpZCA9IFwiXCI7XG5cdGxldCBpID0gc2l6ZSB8IDA7XG5cdHdoaWxlIChpLS0pIGlkICs9IHVybEFscGhhYmV0W01hdGgucmFuZG9tKCkgKiA2NCB8IDBdO1xuXHRyZXR1cm4gaWQ7XG59O1xuXG4vLyNlbmRyZWdpb25cbi8vI3JlZ2lvbiBzcmMvc2hhcmVkL2NvbnN0YW50cy50c1xubGV0IFNPVVJDRU1BUFBJTkdfVVJMID0gXCJzb3VyY2VNYVwiO1xuU09VUkNFTUFQUElOR19VUkwgKz0gXCJwcGluZ1VSTFwiO1xuXG4vLyNlbmRyZWdpb25cbi8vI3JlZ2lvbiBzcmMvc2hhcmVkL3V0aWxzLnRzXG5jb25zdCBpc1dpbmRvd3MgPSB0eXBlb2YgcHJvY2VzcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCI7XG5jb25zdCBBc3luY0Z1bmN0aW9uID0gYXN5bmMgZnVuY3Rpb24oKSB7fS5jb25zdHJ1Y3RvcjtcbmZ1bmN0aW9uIHByb21pc2VXaXRoUmVzb2x2ZXJzKCkge1xuXHRsZXQgcmVzb2x2ZTtcblx0bGV0IHJlamVjdDtcblx0cmV0dXJuIHtcblx0XHRwcm9taXNlOiBuZXcgUHJvbWlzZSgoX3Jlc29sdmUsIF9yZWplY3QpID0+IHtcblx0XHRcdHJlc29sdmUgPSBfcmVzb2x2ZTtcblx0XHRcdHJlamVjdCA9IF9yZWplY3Q7XG5cdFx0fSksXG5cdFx0cmVzb2x2ZSxcblx0XHRyZWplY3Rcblx0fTtcbn1cblxuLy8jZW5kcmVnaW9uXG4vLyNyZWdpb24gc3JjL3NoYXJlZC9tb2R1bGVSdW5uZXJUcmFuc3BvcnQudHNcbmZ1bmN0aW9uIHJldml2ZUludm9rZUVycm9yKGUpIHtcblx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoZS5tZXNzYWdlIHx8IFwiVW5rbm93biBpbnZva2UgZXJyb3JcIik7XG5cdE9iamVjdC5hc3NpZ24oZXJyb3IsIGUsIHsgcnVubmVyRXJyb3I6IC8qIEBfX1BVUkVfXyAqLyBuZXcgRXJyb3IoXCJSdW5uZXJFcnJvclwiKSB9KTtcblx0cmV0dXJuIGVycm9yO1xufVxuY29uc3QgY3JlYXRlSW52b2tlYWJsZVRyYW5zcG9ydCA9ICh0cmFuc3BvcnQkMSkgPT4ge1xuXHRpZiAodHJhbnNwb3J0JDEuaW52b2tlKSByZXR1cm4ge1xuXHRcdC4uLnRyYW5zcG9ydCQxLFxuXHRcdGFzeW5jIGludm9rZShuYW1lLCBkYXRhKSB7XG5cdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCB0cmFuc3BvcnQkMS5pbnZva2Uoe1xuXHRcdFx0XHR0eXBlOiBcImN1c3RvbVwiLFxuXHRcdFx0XHRldmVudDogXCJ2aXRlOmludm9rZVwiLFxuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0aWQ6IFwic2VuZFwiLFxuXHRcdFx0XHRcdG5hbWUsXG5cdFx0XHRcdFx0ZGF0YVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdGlmIChcImVycm9yXCIgaW4gcmVzdWx0KSB0aHJvdyByZXZpdmVJbnZva2VFcnJvcihyZXN1bHQuZXJyb3IpO1xuXHRcdFx0cmV0dXJuIHJlc3VsdC5yZXN1bHQ7XG5cdFx0fVxuXHR9O1xuXHRpZiAoIXRyYW5zcG9ydCQxLnNlbmQgfHwgIXRyYW5zcG9ydCQxLmNvbm5lY3QpIHRocm93IG5ldyBFcnJvcihcInRyYW5zcG9ydCBtdXN0IGltcGxlbWVudCBzZW5kIGFuZCBjb25uZWN0IHdoZW4gaW52b2tlIGlzIG5vdCBpbXBsZW1lbnRlZFwiKTtcblx0Y29uc3QgcnBjUHJvbWlzZXMgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuXHRyZXR1cm4ge1xuXHRcdC4uLnRyYW5zcG9ydCQxLFxuXHRcdGNvbm5lY3QoeyBvbk1lc3NhZ2UsIG9uRGlzY29ubmVjdGlvbiB9KSB7XG5cdFx0XHRyZXR1cm4gdHJhbnNwb3J0JDEuY29ubmVjdCh7XG5cdFx0XHRcdG9uTWVzc2FnZShwYXlsb2FkKSB7XG5cdFx0XHRcdFx0aWYgKHBheWxvYWQudHlwZSA9PT0gXCJjdXN0b21cIiAmJiBwYXlsb2FkLmV2ZW50ID09PSBcInZpdGU6aW52b2tlXCIpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGRhdGEgPSBwYXlsb2FkLmRhdGE7XG5cdFx0XHRcdFx0XHRpZiAoZGF0YS5pZC5zdGFydHNXaXRoKFwicmVzcG9uc2U6XCIpKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGludm9rZUlkID0gZGF0YS5pZC5zbGljZSg5KTtcblx0XHRcdFx0XHRcdFx0Y29uc3QgcHJvbWlzZSA9IHJwY1Byb21pc2VzLmdldChpbnZva2VJZCk7XG5cdFx0XHRcdFx0XHRcdGlmICghcHJvbWlzZSkgcmV0dXJuO1xuXHRcdFx0XHRcdFx0XHRpZiAocHJvbWlzZS50aW1lb3V0SWQpIGNsZWFyVGltZW91dChwcm9taXNlLnRpbWVvdXRJZCk7XG5cdFx0XHRcdFx0XHRcdHJwY1Byb21pc2VzLmRlbGV0ZShpbnZva2VJZCk7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHsgZXJyb3IsIHJlc3VsdCB9ID0gZGF0YS5kYXRhO1xuXHRcdFx0XHRcdFx0XHRpZiAoZXJyb3IpIHByb21pc2UucmVqZWN0KGVycm9yKTtcblx0XHRcdFx0XHRcdFx0ZWxzZSBwcm9taXNlLnJlc29sdmUocmVzdWx0KTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRvbk1lc3NhZ2UocGF5bG9hZCk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uRGlzY29ubmVjdGlvblxuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHRkaXNjb25uZWN0KCkge1xuXHRcdFx0cnBjUHJvbWlzZXMuZm9yRWFjaCgocHJvbWlzZSkgPT4ge1xuXHRcdFx0XHRwcm9taXNlLnJlamVjdCgvKiBAX19QVVJFX18gKi8gbmV3IEVycm9yKGB0cmFuc3BvcnQgd2FzIGRpc2Nvbm5lY3RlZCwgY2Fubm90IGNhbGwgJHtKU09OLnN0cmluZ2lmeShwcm9taXNlLm5hbWUpfWApKTtcblx0XHRcdH0pO1xuXHRcdFx0cnBjUHJvbWlzZXMuY2xlYXIoKTtcblx0XHRcdHJldHVybiB0cmFuc3BvcnQkMS5kaXNjb25uZWN0Py4oKTtcblx0XHR9LFxuXHRcdHNlbmQoZGF0YSkge1xuXHRcdFx0cmV0dXJuIHRyYW5zcG9ydCQxLnNlbmQoZGF0YSk7XG5cdFx0fSxcblx0XHRhc3luYyBpbnZva2UobmFtZSwgZGF0YSkge1xuXHRcdFx0Y29uc3QgcHJvbWlzZUlkID0gbmFub2lkKCk7XG5cdFx0XHRjb25zdCB3cmFwcGVkRGF0YSA9IHtcblx0XHRcdFx0dHlwZTogXCJjdXN0b21cIixcblx0XHRcdFx0ZXZlbnQ6IFwidml0ZTppbnZva2VcIixcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdG5hbWUsXG5cdFx0XHRcdFx0aWQ6IGBzZW5kOiR7cHJvbWlzZUlkfWAsXG5cdFx0XHRcdFx0ZGF0YVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdFx0Y29uc3Qgc2VuZFByb21pc2UgPSB0cmFuc3BvcnQkMS5zZW5kKHdyYXBwZWREYXRhKTtcblx0XHRcdGNvbnN0IHsgcHJvbWlzZSwgcmVzb2x2ZSwgcmVqZWN0IH0gPSBwcm9taXNlV2l0aFJlc29sdmVycygpO1xuXHRcdFx0Y29uc3QgdGltZW91dCA9IHRyYW5zcG9ydCQxLnRpbWVvdXQgPz8gNmU0O1xuXHRcdFx0bGV0IHRpbWVvdXRJZDtcblx0XHRcdGlmICh0aW1lb3V0ID4gMCkge1xuXHRcdFx0XHR0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0XHRycGNQcm9taXNlcy5kZWxldGUocHJvbWlzZUlkKTtcblx0XHRcdFx0XHRyZWplY3QoLyogQF9fUFVSRV9fICovIG5ldyBFcnJvcihgdHJhbnNwb3J0IGludm9rZSB0aW1lZCBvdXQgYWZ0ZXIgJHt0aW1lb3V0fW1zIChkYXRhOiAke0pTT04uc3RyaW5naWZ5KHdyYXBwZWREYXRhKX0pYCkpO1xuXHRcdFx0XHR9LCB0aW1lb3V0KTtcblx0XHRcdFx0dGltZW91dElkPy51bnJlZj8uKCk7XG5cdFx0XHR9XG5cdFx0XHRycGNQcm9taXNlcy5zZXQocHJvbWlzZUlkLCB7XG5cdFx0XHRcdHJlc29sdmUsXG5cdFx0XHRcdHJlamVjdCxcblx0XHRcdFx0bmFtZSxcblx0XHRcdFx0dGltZW91dElkXG5cdFx0XHR9KTtcblx0XHRcdGlmIChzZW5kUHJvbWlzZSkgc2VuZFByb21pc2UuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0XHRjbGVhclRpbWVvdXQodGltZW91dElkKTtcblx0XHRcdFx0cnBjUHJvbWlzZXMuZGVsZXRlKHByb21pc2VJZCk7XG5cdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0fSk7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXR1cm4gYXdhaXQgcHJvbWlzZTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHR0aHJvdyByZXZpdmVJbnZva2VFcnJvcihlcnIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbn07XG5jb25zdCBub3JtYWxpemVNb2R1bGVSdW5uZXJUcmFuc3BvcnQgPSAodHJhbnNwb3J0JDEpID0+IHtcblx0Y29uc3QgaW52b2tlYWJsZVRyYW5zcG9ydCA9IGNyZWF0ZUludm9rZWFibGVUcmFuc3BvcnQodHJhbnNwb3J0JDEpO1xuXHRsZXQgaXNDb25uZWN0ZWQgPSAhaW52b2tlYWJsZVRyYW5zcG9ydC5jb25uZWN0O1xuXHRsZXQgY29ubmVjdGluZ1Byb21pc2U7XG5cdHJldHVybiB7XG5cdFx0Li4udHJhbnNwb3J0JDEsXG5cdFx0Li4uaW52b2tlYWJsZVRyYW5zcG9ydC5jb25uZWN0ID8geyBhc3luYyBjb25uZWN0KG9uTWVzc2FnZSkge1xuXHRcdFx0aWYgKGlzQ29ubmVjdGVkKSByZXR1cm47XG5cdFx0XHRpZiAoY29ubmVjdGluZ1Byb21pc2UpIHtcblx0XHRcdFx0YXdhaXQgY29ubmVjdGluZ1Byb21pc2U7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGNvbnN0IG1heWJlUHJvbWlzZSA9IGludm9rZWFibGVUcmFuc3BvcnQuY29ubmVjdCh7XG5cdFx0XHRcdG9uTWVzc2FnZTogb25NZXNzYWdlID8/ICgoKSA9PiB7fSksXG5cdFx0XHRcdG9uRGlzY29ubmVjdGlvbigpIHtcblx0XHRcdFx0XHRpc0Nvbm5lY3RlZCA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdGlmIChtYXliZVByb21pc2UpIHtcblx0XHRcdFx0Y29ubmVjdGluZ1Byb21pc2UgPSBtYXliZVByb21pc2U7XG5cdFx0XHRcdGF3YWl0IGNvbm5lY3RpbmdQcm9taXNlO1xuXHRcdFx0XHRjb25uZWN0aW5nUHJvbWlzZSA9IHZvaWQgMDtcblx0XHRcdH1cblx0XHRcdGlzQ29ubmVjdGVkID0gdHJ1ZTtcblx0XHR9IH0gOiB7fSxcblx0XHQuLi5pbnZva2VhYmxlVHJhbnNwb3J0LmRpc2Nvbm5lY3QgPyB7IGFzeW5jIGRpc2Nvbm5lY3QoKSB7XG5cdFx0XHRpZiAoIWlzQ29ubmVjdGVkKSByZXR1cm47XG5cdFx0XHRpZiAoY29ubmVjdGluZ1Byb21pc2UpIGF3YWl0IGNvbm5lY3RpbmdQcm9taXNlO1xuXHRcdFx0aXNDb25uZWN0ZWQgPSBmYWxzZTtcblx0XHRcdGF3YWl0IGludm9rZWFibGVUcmFuc3BvcnQuZGlzY29ubmVjdCgpO1xuXHRcdH0gfSA6IHt9LFxuXHRcdGFzeW5jIHNlbmQoZGF0YSkge1xuXHRcdFx0aWYgKCFpbnZva2VhYmxlVHJhbnNwb3J0LnNlbmQpIHJldHVybjtcblx0XHRcdGlmICghaXNDb25uZWN0ZWQpIGlmIChjb25uZWN0aW5nUHJvbWlzZSkgYXdhaXQgY29ubmVjdGluZ1Byb21pc2U7XG5cdFx0XHRlbHNlIHRocm93IG5ldyBFcnJvcihcInNlbmQgd2FzIGNhbGxlZCBiZWZvcmUgY29ubmVjdFwiKTtcblx0XHRcdGF3YWl0IGludm9rZWFibGVUcmFuc3BvcnQuc2VuZChkYXRhKTtcblx0XHR9LFxuXHRcdGFzeW5jIGludm9rZShuYW1lLCBkYXRhKSB7XG5cdFx0XHRpZiAoIWlzQ29ubmVjdGVkKSBpZiAoY29ubmVjdGluZ1Byb21pc2UpIGF3YWl0IGNvbm5lY3RpbmdQcm9taXNlO1xuXHRcdFx0ZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZva2Ugd2FzIGNhbGxlZCBiZWZvcmUgY29ubmVjdFwiKTtcblx0XHRcdHJldHVybiBpbnZva2VhYmxlVHJhbnNwb3J0Lmludm9rZShuYW1lLCBkYXRhKTtcblx0XHR9XG5cdH07XG59O1xuY29uc3QgY3JlYXRlV2ViU29ja2V0TW9kdWxlUnVubmVyVHJhbnNwb3J0ID0gKG9wdGlvbnMpID0+IHtcblx0Y29uc3QgcGluZ0ludGVydmFsID0gb3B0aW9ucy5waW5nSW50ZXJ2YWwgPz8gM2U0O1xuXHRsZXQgd3M7XG5cdGxldCBwaW5nSW50ZXJ2YWxJZDtcblx0cmV0dXJuIHtcblx0XHRhc3luYyBjb25uZWN0KHsgb25NZXNzYWdlLCBvbkRpc2Nvbm5lY3Rpb24gfSkge1xuXHRcdFx0Y29uc3Qgc29ja2V0ID0gb3B0aW9ucy5jcmVhdGVDb25uZWN0aW9uKCk7XG5cdFx0XHRzb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgYXN5bmMgKHsgZGF0YSB9KSA9PiB7XG5cdFx0XHRcdG9uTWVzc2FnZShKU09OLnBhcnNlKGRhdGEpKTtcblx0XHRcdH0pO1xuXHRcdFx0bGV0IGlzT3BlbmVkID0gc29ja2V0LnJlYWR5U3RhdGUgPT09IHNvY2tldC5PUEVOO1xuXHRcdFx0aWYgKCFpc09wZW5lZCkgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0XHRzb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgKCkgPT4ge1xuXHRcdFx0XHRcdGlzT3BlbmVkID0gdHJ1ZTtcblx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdH0sIHsgb25jZTogdHJ1ZSB9KTtcblx0XHRcdFx0c29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbG9zZVwiLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKCFpc09wZW5lZCkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KC8qIEBfX1BVUkVfXyAqLyBuZXcgRXJyb3IoXCJXZWJTb2NrZXQgY2xvc2VkIHdpdGhvdXQgb3BlbmVkLlwiKSk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdG9uTWVzc2FnZSh7XG5cdFx0XHRcdFx0XHR0eXBlOiBcImN1c3RvbVwiLFxuXHRcdFx0XHRcdFx0ZXZlbnQ6IFwidml0ZTp3czpkaXNjb25uZWN0XCIsXG5cdFx0XHRcdFx0XHRkYXRhOiB7IHdlYlNvY2tldDogc29ja2V0IH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRvbkRpc2Nvbm5lY3Rpb24oKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHRcdG9uTWVzc2FnZSh7XG5cdFx0XHRcdHR5cGU6IFwiY3VzdG9tXCIsXG5cdFx0XHRcdGV2ZW50OiBcInZpdGU6d3M6Y29ubmVjdFwiLFxuXHRcdFx0XHRkYXRhOiB7IHdlYlNvY2tldDogc29ja2V0IH1cblx0XHRcdH0pO1xuXHRcdFx0d3MgPSBzb2NrZXQ7XG5cdFx0XHRwaW5nSW50ZXJ2YWxJZCA9IHNldEludGVydmFsKCgpID0+IHtcblx0XHRcdFx0aWYgKHNvY2tldC5yZWFkeVN0YXRlID09PSBzb2NrZXQuT1BFTikgc29ja2V0LnNlbmQoSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcInBpbmdcIiB9KSk7XG5cdFx0XHR9LCBwaW5nSW50ZXJ2YWwpO1xuXHRcdH0sXG5cdFx0ZGlzY29ubmVjdCgpIHtcblx0XHRcdGNsZWFySW50ZXJ2YWwocGluZ0ludGVydmFsSWQpO1xuXHRcdFx0d3M/LmNsb3NlKCk7XG5cdFx0fSxcblx0XHRzZW5kKGRhdGEpIHtcblx0XHRcdHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuXHRcdH1cblx0fTtcbn07XG5cbi8vI2VuZHJlZ2lvblxuLy8jcmVnaW9uIHNyYy9zaGFyZWQvaG1ySGFuZGxlci50c1xuZnVuY3Rpb24gY3JlYXRlSE1SSGFuZGxlcihoYW5kbGVyKSB7XG5cdGNvbnN0IHF1ZXVlID0gbmV3IFF1ZXVlKCk7XG5cdHJldHVybiAocGF5bG9hZCkgPT4gcXVldWUuZW5xdWV1ZSgoKSA9PiBoYW5kbGVyKHBheWxvYWQpKTtcbn1cbnZhciBRdWV1ZSA9IGNsYXNzIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0X2RlZmluZVByb3BlcnR5KHRoaXMsIFwicXVldWVcIiwgW10pO1xuXHRcdF9kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInBlbmRpbmdcIiwgZmFsc2UpO1xuXHR9XG5cdGVucXVldWUocHJvbWlzZSkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHR0aGlzLnF1ZXVlLnB1c2goe1xuXHRcdFx0XHRwcm9taXNlLFxuXHRcdFx0XHRyZXNvbHZlLFxuXHRcdFx0XHRyZWplY3Rcblx0XHRcdH0pO1xuXHRcdFx0dGhpcy5kZXF1ZXVlKCk7XG5cdFx0fSk7XG5cdH1cblx0ZGVxdWV1ZSgpIHtcblx0XHRpZiAodGhpcy5wZW5kaW5nKSByZXR1cm4gZmFsc2U7XG5cdFx0Y29uc3QgaXRlbSA9IHRoaXMucXVldWUuc2hpZnQoKTtcblx0XHRpZiAoIWl0ZW0pIHJldHVybiBmYWxzZTtcblx0XHR0aGlzLnBlbmRpbmcgPSB0cnVlO1xuXHRcdGl0ZW0ucHJvbWlzZSgpLnRoZW4oaXRlbS5yZXNvbHZlKS5jYXRjaChpdGVtLnJlamVjdCkuZmluYWxseSgoKSA9PiB7XG5cdFx0XHR0aGlzLnBlbmRpbmcgPSBmYWxzZTtcblx0XHRcdHRoaXMuZGVxdWV1ZSgpO1xuXHRcdH0pO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59O1xuXG4vLyNlbmRyZWdpb25cbi8vI3JlZ2lvbiBzcmMvY2xpZW50L292ZXJsYXkudHNcbmNvbnN0IGhtckNvbmZpZ05hbWUgPSBcInZpdGUuY29uZmlnLnRzXCI7XG5jb25zdCBiYXNlJDEgPSBcIi9GaW5hbmNlLWFwcC9cIiB8fCBcIi9cIjtcbmZ1bmN0aW9uIGgoZSwgYXR0cnMgPSB7fSwgLi4uY2hpbGRyZW4pIHtcblx0Y29uc3QgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZSk7XG5cdGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKGF0dHJzKSkgZWxlbS5zZXRBdHRyaWJ1dGUoaywgdik7XG5cdGVsZW0uYXBwZW5kKC4uLmNoaWxkcmVuKTtcblx0cmV0dXJuIGVsZW07XG59XG5jb25zdCB0ZW1wbGF0ZVN0eWxlID0gYFxuOmhvc3Qge1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIHRvcDogMDtcbiAgbGVmdDogMDtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTAwJTtcbiAgei1pbmRleDogOTk5OTk7XG4gIC0tbW9ub3NwYWNlOiAnU0ZNb25vLVJlZ3VsYXInLCBDb25zb2xhcyxcbiAgJ0xpYmVyYXRpb24gTW9ubycsIE1lbmxvLCBDb3VyaWVyLCBtb25vc3BhY2U7XG4gIC0tcmVkOiAjZmY1NTU1O1xuICAtLXllbGxvdzogI2UyYWE1MztcbiAgLS1wdXJwbGU6ICNjZmE0ZmY7XG4gIC0tY3lhbjogIzJkZDlkYTtcbiAgLS1kaW06ICNjOWM5Yzk7XG5cbiAgLS13aW5kb3ctYmFja2dyb3VuZDogIzE4MTgxODtcbiAgLS13aW5kb3ctY29sb3I6ICNkOGQ4ZDg7XG59XG5cbi5iYWNrZHJvcCB7XG4gIHBvc2l0aW9uOiBmaXhlZDtcbiAgei1pbmRleDogOTk5OTk7XG4gIHRvcDogMDtcbiAgbGVmdDogMDtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTAwJTtcbiAgb3ZlcmZsb3cteTogc2Nyb2xsO1xuICBtYXJnaW46IDA7XG4gIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC42Nik7XG59XG5cbi53aW5kb3cge1xuICBmb250LWZhbWlseTogdmFyKC0tbW9ub3NwYWNlKTtcbiAgbGluZS1oZWlnaHQ6IDEuNTtcbiAgbWF4LXdpZHRoOiA4MHZ3O1xuICBjb2xvcjogdmFyKC0td2luZG93LWNvbG9yKTtcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgbWFyZ2luOiAzMHB4IGF1dG87XG4gIHBhZGRpbmc6IDIuNXZoIDR2dztcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS13aW5kb3ctYmFja2dyb3VuZCk7XG4gIGJvcmRlci1yYWRpdXM6IDZweCA2cHggOHB4IDhweDtcbiAgYm94LXNoYWRvdzogMCAxOXB4IDM4cHggcmdiYSgwLDAsMCwwLjMwKSwgMCAxNXB4IDEycHggcmdiYSgwLDAsMCwwLjIyKTtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgYm9yZGVyLXRvcDogOHB4IHNvbGlkIHZhcigtLXJlZCk7XG4gIGRpcmVjdGlvbjogbHRyO1xuICB0ZXh0LWFsaWduOiBsZWZ0O1xufVxuXG5wcmUge1xuICBmb250LWZhbWlseTogdmFyKC0tbW9ub3NwYWNlKTtcbiAgZm9udC1zaXplOiAxNnB4O1xuICBtYXJnaW4tdG9wOiAwO1xuICBtYXJnaW4tYm90dG9tOiAxZW07XG4gIG92ZXJmbG93LXg6IHNjcm9sbDtcbiAgc2Nyb2xsYmFyLXdpZHRoOiBub25lO1xufVxuXG5wcmU6Oi13ZWJraXQtc2Nyb2xsYmFyIHtcbiAgZGlzcGxheTogbm9uZTtcbn1cblxucHJlLmZyYW1lOjotd2Via2l0LXNjcm9sbGJhciB7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBoZWlnaHQ6IDVweDtcbn1cblxucHJlLmZyYW1lOjotd2Via2l0LXNjcm9sbGJhci10aHVtYiB7XG4gIGJhY2tncm91bmQ6ICM5OTk7XG4gIGJvcmRlci1yYWRpdXM6IDVweDtcbn1cblxucHJlLmZyYW1lIHtcbiAgc2Nyb2xsYmFyLXdpZHRoOiB0aGluO1xufVxuXG4ubWVzc2FnZSB7XG4gIGxpbmUtaGVpZ2h0OiAxLjM7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbn1cblxuLm1lc3NhZ2UtYm9keSB7XG4gIGNvbG9yOiB2YXIoLS1yZWQpO1xufVxuXG4ucGx1Z2luIHtcbiAgY29sb3I6IHZhcigtLXB1cnBsZSk7XG59XG5cbi5maWxlIHtcbiAgY29sb3I6IHZhcigtLWN5YW4pO1xuICBtYXJnaW4tYm90dG9tOiAwO1xuICB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLWFsbDtcbn1cblxuLmZyYW1lIHtcbiAgY29sb3I6IHZhcigtLXllbGxvdyk7XG59XG5cbi5zdGFjayB7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgY29sb3I6IHZhcigtLWRpbSk7XG59XG5cbi50aXAge1xuICBmb250LXNpemU6IDEzcHg7XG4gIGNvbG9yOiAjOTk5O1xuICBib3JkZXItdG9wOiAxcHggZG90dGVkICM5OTk7XG4gIHBhZGRpbmctdG9wOiAxM3B4O1xuICBsaW5lLWhlaWdodDogMS44O1xufVxuXG5jb2RlIHtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBmb250LWZhbWlseTogdmFyKC0tbW9ub3NwYWNlKTtcbiAgY29sb3I6IHZhcigtLXllbGxvdyk7XG59XG5cbi5maWxlLWxpbmsge1xuICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuXG5rYmQge1xuICBsaW5lLWhlaWdodDogMS41O1xuICBmb250LWZhbWlseTogdWktbW9ub3NwYWNlLCBNZW5sbywgTW9uYWNvLCBDb25zb2xhcywgXCJMaWJlcmF0aW9uIE1vbm9cIiwgXCJDb3VyaWVyIE5ld1wiLCBtb25vc3BhY2U7XG4gIGZvbnQtc2l6ZTogMC43NXJlbTtcbiAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiKDM4LCA0MCwgNDQpO1xuICBjb2xvcjogcmdiKDE2NiwgMTY3LCAxNzEpO1xuICBwYWRkaW5nOiAwLjE1cmVtIDAuM3JlbTtcbiAgYm9yZGVyLXJhZGl1czogMC4yNXJlbTtcbiAgYm9yZGVyLXdpZHRoOiAwLjA2MjVyZW0gMC4wNjI1cmVtIDAuMTg3NXJlbTtcbiAgYm9yZGVyLXN0eWxlOiBzb2xpZDtcbiAgYm9yZGVyLWNvbG9yOiByZ2IoNTQsIDU3LCA2NCk7XG4gIGJvcmRlci1pbWFnZTogaW5pdGlhbDtcbn1cbmA7XG5jb25zdCBjcmVhdGVUZW1wbGF0ZSA9ICgpID0+IGgoXCJkaXZcIiwge1xuXHRjbGFzczogXCJiYWNrZHJvcFwiLFxuXHRwYXJ0OiBcImJhY2tkcm9wXCJcbn0sIGgoXCJkaXZcIiwge1xuXHRjbGFzczogXCJ3aW5kb3dcIixcblx0cGFydDogXCJ3aW5kb3dcIlxufSwgaChcInByZVwiLCB7XG5cdGNsYXNzOiBcIm1lc3NhZ2VcIixcblx0cGFydDogXCJtZXNzYWdlXCJcbn0sIGgoXCJzcGFuXCIsIHtcblx0Y2xhc3M6IFwicGx1Z2luXCIsXG5cdHBhcnQ6IFwicGx1Z2luXCJcbn0pLCBoKFwic3BhblwiLCB7XG5cdGNsYXNzOiBcIm1lc3NhZ2UtYm9keVwiLFxuXHRwYXJ0OiBcIm1lc3NhZ2UtYm9keVwiXG59KSksIGgoXCJwcmVcIiwge1xuXHRjbGFzczogXCJmaWxlXCIsXG5cdHBhcnQ6IFwiZmlsZVwiXG59KSwgaChcInByZVwiLCB7XG5cdGNsYXNzOiBcImZyYW1lXCIsXG5cdHBhcnQ6IFwiZnJhbWVcIlxufSksIGgoXCJwcmVcIiwge1xuXHRjbGFzczogXCJzdGFja1wiLFxuXHRwYXJ0OiBcInN0YWNrXCJcbn0pLCBoKFwiZGl2XCIsIHtcblx0Y2xhc3M6IFwidGlwXCIsXG5cdHBhcnQ6IFwidGlwXCJcbn0sIFwiQ2xpY2sgb3V0c2lkZSwgcHJlc3MgXCIsIGgoXCJrYmRcIiwge30sIFwiRXNjXCIpLCBcIiBrZXksIG9yIGZpeCB0aGUgY29kZSB0byBkaXNtaXNzLlwiLCBoKFwiYnJcIiksIFwiWW91IGNhbiBhbHNvIGRpc2FibGUgdGhpcyBvdmVybGF5IGJ5IHNldHRpbmcgXCIsIGgoXCJjb2RlXCIsIHsgcGFydDogXCJjb25maWctb3B0aW9uLW5hbWVcIiB9LCBcInNlcnZlci5obXIub3ZlcmxheVwiKSwgXCIgdG8gXCIsIGgoXCJjb2RlXCIsIHsgcGFydDogXCJjb25maWctb3B0aW9uLXZhbHVlXCIgfSwgXCJmYWxzZVwiKSwgXCIgaW4gXCIsIGgoXCJjb2RlXCIsIHsgcGFydDogXCJjb25maWctZmlsZS1uYW1lXCIgfSwgaG1yQ29uZmlnTmFtZSksIFwiLlwiKSksIGgoXCJzdHlsZVwiLCB7fSwgdGVtcGxhdGVTdHlsZSkpO1xuY29uc3QgZmlsZVJFID0gLyg/OmZpbGU6XFwvXFwvKT8oPzpbYS16QS1aXTpcXFxcfFxcLykuKj86XFxkKzpcXGQrL2c7XG5jb25zdCBjb2RlZnJhbWVSRSA9IC9eKD86Pj9cXHMqXFxkK1xccytcXHwuKnxcXHMrXFx8XFxzKlxcXi4qKVxccj9cXG4vZ207XG5jb25zdCB7IEhUTUxFbGVtZW50ID0gY2xhc3Mge30gfSA9IGdsb2JhbFRoaXM7XG52YXIgRXJyb3JPdmVybGF5ID0gY2xhc3MgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cdGNvbnN0cnVjdG9yKGVyciwgbGlua3MgPSB0cnVlKSB7XG5cdFx0c3VwZXIoKTtcblx0XHRfZGVmaW5lUHJvcGVydHkodGhpcywgXCJyb290XCIsIHZvaWQgMCk7XG5cdFx0X2RlZmluZVByb3BlcnR5KHRoaXMsIFwiY2xvc2VPbkVzY1wiLCB2b2lkIDApO1xuXHRcdHRoaXMucm9vdCA9IHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogXCJvcGVuXCIgfSk7XG5cdFx0dGhpcy5yb290LmFwcGVuZENoaWxkKGNyZWF0ZVRlbXBsYXRlKCkpO1xuXHRcdGNvZGVmcmFtZVJFLmxhc3RJbmRleCA9IDA7XG5cdFx0Y29uc3QgaGFzRnJhbWUgPSBlcnIuZnJhbWUgJiYgY29kZWZyYW1lUkUudGVzdChlcnIuZnJhbWUpO1xuXHRcdGNvbnN0IG1lc3NhZ2UgPSBoYXNGcmFtZSA/IGVyci5tZXNzYWdlLnJlcGxhY2UoY29kZWZyYW1lUkUsIFwiXCIpIDogZXJyLm1lc3NhZ2U7XG5cdFx0aWYgKGVyci5wbHVnaW4pIHRoaXMudGV4dChcIi5wbHVnaW5cIiwgYFtwbHVnaW46JHtlcnIucGx1Z2lufV0gYCk7XG5cdFx0dGhpcy50ZXh0KFwiLm1lc3NhZ2UtYm9keVwiLCBtZXNzYWdlLnRyaW0oKSk7XG5cdFx0Y29uc3QgW2ZpbGVdID0gKGVyci5sb2M/LmZpbGUgfHwgZXJyLmlkIHx8IFwidW5rbm93biBmaWxlXCIpLnNwbGl0KGA/YCk7XG5cdFx0aWYgKGVyci5sb2MpIHRoaXMudGV4dChcIi5maWxlXCIsIGAke2ZpbGV9OiR7ZXJyLmxvYy5saW5lfToke2Vyci5sb2MuY29sdW1ufWAsIGxpbmtzKTtcblx0XHRlbHNlIGlmIChlcnIuaWQpIHRoaXMudGV4dChcIi5maWxlXCIsIGZpbGUpO1xuXHRcdGlmIChoYXNGcmFtZSkgdGhpcy50ZXh0KFwiLmZyYW1lXCIsIGVyci5mcmFtZS50cmltKCkpO1xuXHRcdHRoaXMudGV4dChcIi5zdGFja1wiLCBlcnIuc3RhY2ssIGxpbmtzKTtcblx0XHR0aGlzLnJvb3QucXVlcnlTZWxlY3RvcihcIi53aW5kb3dcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH0pO1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcblx0XHRcdHRoaXMuY2xvc2UoKTtcblx0XHR9KTtcblx0XHR0aGlzLmNsb3NlT25Fc2MgPSAoZSkgPT4ge1xuXHRcdFx0aWYgKGUua2V5ID09PSBcIkVzY2FwZVwiIHx8IGUuY29kZSA9PT0gXCJFc2NhcGVcIikgdGhpcy5jbG9zZSgpO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5jbG9zZU9uRXNjKTtcblx0fVxuXHR0ZXh0KHNlbGVjdG9yLCB0ZXh0LCBsaW5rRmlsZXMgPSBmYWxzZSkge1xuXHRcdGNvbnN0IGVsID0gdGhpcy5yb290LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuXHRcdGlmICghbGlua0ZpbGVzKSBlbC50ZXh0Q29udGVudCA9IHRleHQ7XG5cdFx0ZWxzZSB7XG5cdFx0XHRsZXQgY3VySW5kZXggPSAwO1xuXHRcdFx0bGV0IG1hdGNoO1xuXHRcdFx0ZmlsZVJFLmxhc3RJbmRleCA9IDA7XG5cdFx0XHR3aGlsZSAobWF0Y2ggPSBmaWxlUkUuZXhlYyh0ZXh0KSkge1xuXHRcdFx0XHRjb25zdCB7IDA6IGZpbGUsIGluZGV4IH0gPSBtYXRjaDtcblx0XHRcdFx0Y29uc3QgZnJhZyA9IHRleHQuc2xpY2UoY3VySW5kZXgsIGluZGV4KTtcblx0XHRcdFx0ZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZnJhZykpO1xuXHRcdFx0XHRjb25zdCBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG5cdFx0XHRcdGxpbmsudGV4dENvbnRlbnQgPSBmaWxlO1xuXHRcdFx0XHRsaW5rLmNsYXNzTmFtZSA9IFwiZmlsZS1saW5rXCI7XG5cdFx0XHRcdGxpbmsub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0XHRmZXRjaChuZXcgVVJMKGAke2Jhc2UkMX1fX29wZW4taW4tZWRpdG9yP2ZpbGU9JHtlbmNvZGVVUklDb21wb25lbnQoZmlsZSl9YCwgaW1wb3J0Lm1ldGEudXJsKSk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGVsLmFwcGVuZENoaWxkKGxpbmspO1xuXHRcdFx0XHRjdXJJbmRleCArPSBmcmFnLmxlbmd0aCArIGZpbGUubGVuZ3RoO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGN1ckluZGV4IDwgdGV4dC5sZW5ndGgpIGVsLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQuc2xpY2UoY3VySW5kZXgpKSk7XG5cdFx0fVxuXHR9XG5cdGNsb3NlKCkge1xuXHRcdHRoaXMucGFyZW50Tm9kZT8ucmVtb3ZlQ2hpbGQodGhpcyk7XG5cdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5jbG9zZU9uRXNjKTtcblx0fVxufTtcbmNvbnN0IG92ZXJsYXlJZCA9IFwidml0ZS1lcnJvci1vdmVybGF5XCI7XG5jb25zdCB7IGN1c3RvbUVsZW1lbnRzIH0gPSBnbG9iYWxUaGlzO1xuaWYgKGN1c3RvbUVsZW1lbnRzICYmICFjdXN0b21FbGVtZW50cy5nZXQob3ZlcmxheUlkKSkgY3VzdG9tRWxlbWVudHMuZGVmaW5lKG92ZXJsYXlJZCwgRXJyb3JPdmVybGF5KTtcblxuLy8jZW5kcmVnaW9uXG4vLyNyZWdpb24gc3JjL2NsaWVudC9jbGllbnQudHNcbmNvbnNvbGUuZGVidWcoXCJbdml0ZV0gY29ubmVjdGluZy4uLlwiKTtcbmNvbnN0IGltcG9ydE1ldGFVcmwgPSBuZXcgVVJMKGltcG9ydC5tZXRhLnVybCk7XG5jb25zdCBzZXJ2ZXJIb3N0ID0gXCJsb2NhbGhvc3Q6NTE3My9GaW5hbmNlLWFwcC9cIjtcbmNvbnN0IHNvY2tldFByb3RvY29sID0gbnVsbCB8fCAoaW1wb3J0TWV0YVVybC5wcm90b2NvbCA9PT0gXCJodHRwczpcIiA/IFwid3NzXCIgOiBcIndzXCIpO1xuY29uc3QgaG1yUG9ydCA9IG51bGw7XG5jb25zdCBzb2NrZXRIb3N0ID0gYCR7bnVsbCB8fCBpbXBvcnRNZXRhVXJsLmhvc3RuYW1lfToke2htclBvcnQgfHwgaW1wb3J0TWV0YVVybC5wb3J0fSR7XCIvRmluYW5jZS1hcHAvXCJ9YDtcbmNvbnN0IGRpcmVjdFNvY2tldEhvc3QgPSBcImxvY2FsaG9zdDo1MTczL0ZpbmFuY2UtYXBwL1wiO1xuY29uc3QgYmFzZSA9IFwiL0ZpbmFuY2UtYXBwL1wiIHx8IFwiL1wiO1xuY29uc3QgaG1yVGltZW91dCA9IDMwMDAwO1xuY29uc3Qgd3NUb2tlbiA9IFwiSXpJSHpBdVpKdzhiXCI7XG5jb25zdCB0cmFuc3BvcnQgPSBub3JtYWxpemVNb2R1bGVSdW5uZXJUcmFuc3BvcnQoKCgpID0+IHtcblx0bGV0IHdzVHJhbnNwb3J0ID0gY3JlYXRlV2ViU29ja2V0TW9kdWxlUnVubmVyVHJhbnNwb3J0KHtcblx0XHRjcmVhdGVDb25uZWN0aW9uOiAoKSA9PiBuZXcgV2ViU29ja2V0KGAke3NvY2tldFByb3RvY29sfTovLyR7c29ja2V0SG9zdH0/dG9rZW49JHt3c1Rva2VufWAsIFwidml0ZS1obXJcIiksXG5cdFx0cGluZ0ludGVydmFsOiBobXJUaW1lb3V0XG5cdH0pO1xuXHRyZXR1cm4ge1xuXHRcdGFzeW5jIGNvbm5lY3QoaGFuZGxlcnMpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHdzVHJhbnNwb3J0LmNvbm5lY3QoaGFuZGxlcnMpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAoIWhtclBvcnQpIHtcblx0XHRcdFx0XHR3c1RyYW5zcG9ydCA9IGNyZWF0ZVdlYlNvY2tldE1vZHVsZVJ1bm5lclRyYW5zcG9ydCh7XG5cdFx0XHRcdFx0XHRjcmVhdGVDb25uZWN0aW9uOiAoKSA9PiBuZXcgV2ViU29ja2V0KGAke3NvY2tldFByb3RvY29sfTovLyR7ZGlyZWN0U29ja2V0SG9zdH0/dG9rZW49JHt3c1Rva2VufWAsIFwidml0ZS1obXJcIiksXG5cdFx0XHRcdFx0XHRwaW5nSW50ZXJ2YWw6IGhtclRpbWVvdXRcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0YXdhaXQgd3NUcmFuc3BvcnQuY29ubmVjdChoYW5kbGVycyk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmluZm8oXCJbdml0ZV0gRGlyZWN0IHdlYnNvY2tldCBjb25uZWN0aW9uIGZhbGxiYWNrLiBDaGVjayBvdXQgaHR0cHM6Ly92aXRlLmRldi9jb25maWcvc2VydmVyLW9wdGlvbnMuaHRtbCNzZXJ2ZXItaG1yIHRvIHJlbW92ZSB0aGUgcHJldmlvdXMgY29ubmVjdGlvbiBlcnJvci5cIik7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZSQxKSB7XG5cdFx0XHRcdFx0XHRpZiAoZSQxIGluc3RhbmNlb2YgRXJyb3IgJiYgZSQxLm1lc3NhZ2UuaW5jbHVkZXMoXCJXZWJTb2NrZXQgY2xvc2VkIHdpdGhvdXQgb3BlbmVkLlwiKSkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBjdXJyZW50U2NyaXB0SG9zdFVSTCA9IG5ldyBVUkwoaW1wb3J0Lm1ldGEudXJsKTtcblx0XHRcdFx0XHRcdFx0Y29uc3QgY3VycmVudFNjcmlwdEhvc3QgPSBjdXJyZW50U2NyaXB0SG9zdFVSTC5ob3N0ICsgY3VycmVudFNjcmlwdEhvc3RVUkwucGF0aG5hbWUucmVwbGFjZSgvQHZpdGVcXC9jbGllbnQkLywgXCJcIik7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYFt2aXRlXSBmYWlsZWQgdG8gY29ubmVjdCB0byB3ZWJzb2NrZXQuXG55b3VyIGN1cnJlbnQgc2V0dXA6XG4gIChicm93c2VyKSAke2N1cnJlbnRTY3JpcHRIb3N0fSA8LS1bSFRUUF0tLT4gJHtzZXJ2ZXJIb3N0fSAoc2VydmVyKVxcbiAgKGJyb3dzZXIpICR7c29ja2V0SG9zdH0gPC0tW1dlYlNvY2tldCAoZmFpbGluZyldLS0+ICR7ZGlyZWN0U29ja2V0SG9zdH0gKHNlcnZlcilcXG5DaGVjayBvdXQgeW91ciBWaXRlIC8gbmV0d29yayBjb25maWd1cmF0aW9uIGFuZCBodHRwczovL3ZpdGUuZGV2L2NvbmZpZy9zZXJ2ZXItb3B0aW9ucy5odG1sI3NlcnZlci1obXIgLmApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc29sZS5lcnJvcihgW3ZpdGVdIGZhaWxlZCB0byBjb25uZWN0IHRvIHdlYnNvY2tldCAoJHtlfSkuIGApO1xuXHRcdFx0XHR0aHJvdyBlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0YXN5bmMgZGlzY29ubmVjdCgpIHtcblx0XHRcdGF3YWl0IHdzVHJhbnNwb3J0LmRpc2Nvbm5lY3QoKTtcblx0XHR9LFxuXHRcdHNlbmQoZGF0YSkge1xuXHRcdFx0d3NUcmFuc3BvcnQuc2VuZChkYXRhKTtcblx0XHR9XG5cdH07XG59KSgpKTtcbmxldCB3aWxsVW5sb2FkID0gZmFsc2U7XG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikgd2luZG93LmFkZEV2ZW50TGlzdGVuZXI/LihcImJlZm9yZXVubG9hZFwiLCAoKSA9PiB7XG5cdHdpbGxVbmxvYWQgPSB0cnVlO1xufSk7XG5mdW5jdGlvbiBjbGVhblVybChwYXRobmFtZSkge1xuXHRjb25zdCB1cmwgPSBuZXcgVVJMKHBhdGhuYW1lLCBcImh0dHA6Ly92aXRlLmRldlwiKTtcblx0dXJsLnNlYXJjaFBhcmFtcy5kZWxldGUoXCJkaXJlY3RcIik7XG5cdHJldHVybiB1cmwucGF0aG5hbWUgKyB1cmwuc2VhcmNoO1xufVxubGV0IGlzRmlyc3RVcGRhdGUgPSB0cnVlO1xuY29uc3Qgb3V0ZGF0ZWRMaW5rVGFncyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha1NldCgpO1xuY29uc3QgZGVib3VuY2VSZWxvYWQgPSAodGltZSkgPT4ge1xuXHRsZXQgdGltZXI7XG5cdHJldHVybiAoKSA9PiB7XG5cdFx0aWYgKHRpbWVyKSB7XG5cdFx0XHRjbGVhclRpbWVvdXQodGltZXIpO1xuXHRcdFx0dGltZXIgPSBudWxsO1xuXHRcdH1cblx0XHR0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0bG9jYXRpb24ucmVsb2FkKCk7XG5cdFx0fSwgdGltZSk7XG5cdH07XG59O1xuY29uc3QgcGFnZVJlbG9hZCA9IGRlYm91bmNlUmVsb2FkKDIwKTtcbmNvbnN0IGhtckNsaWVudCA9IG5ldyBITVJDbGllbnQoe1xuXHRlcnJvcjogKGVycikgPT4gY29uc29sZS5lcnJvcihcIlt2aXRlXVwiLCBlcnIpLFxuXHRkZWJ1ZzogKC4uLm1zZykgPT4gY29uc29sZS5kZWJ1ZyhcIlt2aXRlXVwiLCAuLi5tc2cpXG59LCB0cmFuc3BvcnQsIGFzeW5jIGZ1bmN0aW9uIGltcG9ydFVwZGF0ZWRNb2R1bGUoeyBhY2NlcHRlZFBhdGgsIHRpbWVzdGFtcCwgZXhwbGljaXRJbXBvcnRSZXF1aXJlZCwgaXNXaXRoaW5DaXJjdWxhckltcG9ydCB9KSB7XG5cdGNvbnN0IFthY2NlcHRlZFBhdGhXaXRob3V0UXVlcnksIHF1ZXJ5XSA9IGFjY2VwdGVkUGF0aC5zcGxpdChgP2ApO1xuXHRjb25zdCBpbXBvcnRQcm9taXNlID0gaW1wb3J0KFxuXHRcdC8qIEB2aXRlLWlnbm9yZSAqL1xuXHRcdGJhc2UgKyBhY2NlcHRlZFBhdGhXaXRob3V0UXVlcnkuc2xpY2UoMSkgKyBgPyR7ZXhwbGljaXRJbXBvcnRSZXF1aXJlZCA/IFwiaW1wb3J0JlwiIDogXCJcIn10PSR7dGltZXN0YW1wfSR7cXVlcnkgPyBgJiR7cXVlcnl9YCA6IFwiXCJ9YFxuKTtcblx0aWYgKGlzV2l0aGluQ2lyY3VsYXJJbXBvcnQpIGltcG9ydFByb21pc2UuY2F0Y2goKCkgPT4ge1xuXHRcdGNvbnNvbGUuaW5mbyhgW2htcl0gJHthY2NlcHRlZFBhdGh9IGZhaWxlZCB0byBhcHBseSBITVIgYXMgaXQncyB3aXRoaW4gYSBjaXJjdWxhciBpbXBvcnQuIFJlbG9hZGluZyBwYWdlIHRvIHJlc2V0IHRoZSBleGVjdXRpb24gb3JkZXIuIFRvIGRlYnVnIGFuZCBicmVhayB0aGUgY2lyY3VsYXIgaW1wb3J0LCB5b3UgY2FuIHJ1biBcXGB2aXRlIC0tZGVidWcgaG1yXFxgIHRvIGxvZyB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeSBwYXRoIGlmIGEgZmlsZSBjaGFuZ2UgdHJpZ2dlcmVkIGl0LmApO1xuXHRcdHBhZ2VSZWxvYWQoKTtcblx0fSk7XG5cdHJldHVybiBhd2FpdCBpbXBvcnRQcm9taXNlO1xufSk7XG50cmFuc3BvcnQuY29ubmVjdChjcmVhdGVITVJIYW5kbGVyKGhhbmRsZU1lc3NhZ2UpKTtcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UocGF5bG9hZCkge1xuXHRzd2l0Y2ggKHBheWxvYWQudHlwZSkge1xuXHRcdGNhc2UgXCJjb25uZWN0ZWRcIjpcblx0XHRcdGNvbnNvbGUuZGVidWcoYFt2aXRlXSBjb25uZWN0ZWQuYCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIFwidXBkYXRlXCI6XG5cdFx0XHRhd2FpdCBobXJDbGllbnQubm90aWZ5TGlzdGVuZXJzKFwidml0ZTpiZWZvcmVVcGRhdGVcIiwgcGF5bG9hZCk7XG5cdFx0XHRpZiAoaGFzRG9jdW1lbnQpIGlmIChpc0ZpcnN0VXBkYXRlICYmIGhhc0Vycm9yT3ZlcmxheSgpKSB7XG5cdFx0XHRcdGxvY2F0aW9uLnJlbG9hZCgpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoZW5hYmxlT3ZlcmxheSkgY2xlYXJFcnJvck92ZXJsYXkoKTtcblx0XHRcdFx0aXNGaXJzdFVwZGF0ZSA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwocGF5bG9hZC51cGRhdGVzLm1hcChhc3luYyAodXBkYXRlKSA9PiB7XG5cdFx0XHRcdGlmICh1cGRhdGUudHlwZSA9PT0gXCJqcy11cGRhdGVcIikgcmV0dXJuIGhtckNsaWVudC5xdWV1ZVVwZGF0ZSh1cGRhdGUpO1xuXHRcdFx0XHRjb25zdCB7IHBhdGgsIHRpbWVzdGFtcCB9ID0gdXBkYXRlO1xuXHRcdFx0XHRjb25zdCBzZWFyY2hVcmwgPSBjbGVhblVybChwYXRoKTtcblx0XHRcdFx0Y29uc3QgZWwgPSBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJsaW5rXCIpKS5maW5kKChlKSA9PiAhb3V0ZGF0ZWRMaW5rVGFncy5oYXMoZSkgJiYgY2xlYW5VcmwoZS5ocmVmKS5pbmNsdWRlcyhzZWFyY2hVcmwpKTtcblx0XHRcdFx0aWYgKCFlbCkgcmV0dXJuO1xuXHRcdFx0XHRjb25zdCBuZXdQYXRoID0gYCR7YmFzZX0ke3NlYXJjaFVybC5zbGljZSgxKX0ke3NlYXJjaFVybC5pbmNsdWRlcyhcIj9cIikgPyBcIiZcIiA6IFwiP1wifXQ9JHt0aW1lc3RhbXB9YDtcblx0XHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgbmV3TGlua1RhZyA9IGVsLmNsb25lTm9kZSgpO1xuXHRcdFx0XHRcdG5ld0xpbmtUYWcuaHJlZiA9IG5ldyBVUkwobmV3UGF0aCwgZWwuaHJlZikuaHJlZjtcblx0XHRcdFx0XHRjb25zdCByZW1vdmVPbGRFbCA9ICgpID0+IHtcblx0XHRcdFx0XHRcdGVsLnJlbW92ZSgpO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5kZWJ1ZyhgW3ZpdGVdIGNzcyBob3QgdXBkYXRlZDogJHtzZWFyY2hVcmx9YCk7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRuZXdMaW5rVGFnLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIHJlbW92ZU9sZEVsKTtcblx0XHRcdFx0XHRuZXdMaW5rVGFnLmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCByZW1vdmVPbGRFbCk7XG5cdFx0XHRcdFx0b3V0ZGF0ZWRMaW5rVGFncy5hZGQoZWwpO1xuXHRcdFx0XHRcdGVsLmFmdGVyKG5ld0xpbmtUYWcpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pKTtcblx0XHRcdGF3YWl0IGhtckNsaWVudC5ub3RpZnlMaXN0ZW5lcnMoXCJ2aXRlOmFmdGVyVXBkYXRlXCIsIHBheWxvYWQpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSBcImN1c3RvbVwiOlxuXHRcdFx0YXdhaXQgaG1yQ2xpZW50Lm5vdGlmeUxpc3RlbmVycyhwYXlsb2FkLmV2ZW50LCBwYXlsb2FkLmRhdGEpO1xuXHRcdFx0aWYgKHBheWxvYWQuZXZlbnQgPT09IFwidml0ZTp3czpkaXNjb25uZWN0XCIpIHtcblx0XHRcdFx0aWYgKGhhc0RvY3VtZW50ICYmICF3aWxsVW5sb2FkKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYFt2aXRlXSBzZXJ2ZXIgY29ubmVjdGlvbiBsb3N0LiBQb2xsaW5nIGZvciByZXN0YXJ0Li4uYCk7XG5cdFx0XHRcdFx0Y29uc3Qgc29ja2V0ID0gcGF5bG9hZC5kYXRhLndlYlNvY2tldDtcblx0XHRcdFx0XHRjb25zdCB1cmwgPSBuZXcgVVJMKHNvY2tldC51cmwpO1xuXHRcdFx0XHRcdHVybC5zZWFyY2ggPSBcIlwiO1xuXHRcdFx0XHRcdGF3YWl0IHdhaXRGb3JTdWNjZXNzZnVsUGluZyh1cmwuaHJlZik7XG5cdFx0XHRcdFx0bG9jYXRpb24ucmVsb2FkKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgXCJmdWxsLXJlbG9hZFwiOlxuXHRcdFx0YXdhaXQgaG1yQ2xpZW50Lm5vdGlmeUxpc3RlbmVycyhcInZpdGU6YmVmb3JlRnVsbFJlbG9hZFwiLCBwYXlsb2FkKTtcblx0XHRcdGlmIChoYXNEb2N1bWVudCkgaWYgKHBheWxvYWQucGF0aCAmJiBwYXlsb2FkLnBhdGguZW5kc1dpdGgoXCIuaHRtbFwiKSkge1xuXHRcdFx0XHRjb25zdCBwYWdlUGF0aCA9IGRlY29kZVVSSShsb2NhdGlvbi5wYXRobmFtZSk7XG5cdFx0XHRcdGNvbnN0IHBheWxvYWRQYXRoID0gYmFzZSArIHBheWxvYWQucGF0aC5zbGljZSgxKTtcblx0XHRcdFx0aWYgKHBhZ2VQYXRoID09PSBwYXlsb2FkUGF0aCB8fCBwYXlsb2FkLnBhdGggPT09IFwiL2luZGV4Lmh0bWxcIiB8fCBwYWdlUGF0aC5lbmRzV2l0aChcIi9cIikgJiYgcGFnZVBhdGggKyBcImluZGV4Lmh0bWxcIiA9PT0gcGF5bG9hZFBhdGgpIHBhZ2VSZWxvYWQoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fSBlbHNlIHBhZ2VSZWxvYWQoKTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgXCJwcnVuZVwiOlxuXHRcdFx0YXdhaXQgaG1yQ2xpZW50Lm5vdGlmeUxpc3RlbmVycyhcInZpdGU6YmVmb3JlUHJ1bmVcIiwgcGF5bG9hZCk7XG5cdFx0XHRhd2FpdCBobXJDbGllbnQucHJ1bmVQYXRocyhwYXlsb2FkLnBhdGhzKTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgXCJlcnJvclwiOlxuXHRcdFx0YXdhaXQgaG1yQ2xpZW50Lm5vdGlmeUxpc3RlbmVycyhcInZpdGU6ZXJyb3JcIiwgcGF5bG9hZCk7XG5cdFx0XHRpZiAoaGFzRG9jdW1lbnQpIHtcblx0XHRcdFx0Y29uc3QgZXJyID0gcGF5bG9hZC5lcnI7XG5cdFx0XHRcdGlmIChlbmFibGVPdmVybGF5KSBjcmVhdGVFcnJvck92ZXJsYXkoZXJyKTtcblx0XHRcdFx0ZWxzZSBjb25zb2xlLmVycm9yKGBbdml0ZV0gSW50ZXJuYWwgU2VydmVyIEVycm9yXFxuJHtlcnIubWVzc2FnZX1cXG4ke2Vyci5zdGFja31gKTtcblx0XHRcdH1cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgXCJwaW5nXCI6IGJyZWFrO1xuXHRcdGRlZmF1bHQ6IHJldHVybiBwYXlsb2FkO1xuXHR9XG59XG5jb25zdCBlbmFibGVPdmVybGF5ID0gdHJ1ZTtcbmNvbnN0IGhhc0RvY3VtZW50ID0gXCJkb2N1bWVudFwiIGluIGdsb2JhbFRoaXM7XG5mdW5jdGlvbiBjcmVhdGVFcnJvck92ZXJsYXkoZXJyKSB7XG5cdGNsZWFyRXJyb3JPdmVybGF5KCk7XG5cdGNvbnN0IHsgY3VzdG9tRWxlbWVudHM6IGN1c3RvbUVsZW1lbnRzJDEgfSA9IGdsb2JhbFRoaXM7XG5cdGlmIChjdXN0b21FbGVtZW50cyQxKSB7XG5cdFx0Y29uc3QgRXJyb3JPdmVybGF5Q29uc3RydWN0b3IgPSBjdXN0b21FbGVtZW50cyQxLmdldChvdmVybGF5SWQpO1xuXHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobmV3IEVycm9yT3ZlcmxheUNvbnN0cnVjdG9yKGVycikpO1xuXHR9XG59XG5mdW5jdGlvbiBjbGVhckVycm9yT3ZlcmxheSgpIHtcblx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChvdmVybGF5SWQpLmZvckVhY2goKG4pID0+IG4uY2xvc2UoKSk7XG59XG5mdW5jdGlvbiBoYXNFcnJvck92ZXJsYXkoKSB7XG5cdHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKG92ZXJsYXlJZCkubGVuZ3RoO1xufVxuZnVuY3Rpb24gd2FpdEZvclN1Y2Nlc3NmdWxQaW5nKHNvY2tldFVybCkge1xuXHRpZiAodHlwZW9mIFNoYXJlZFdvcmtlciA9PT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdGNvbnN0IHZpc2liaWxpdHlNYW5hZ2VyID0ge1xuXHRcdFx0Y3VycmVudFN0YXRlOiBkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUsXG5cdFx0XHRsaXN0ZW5lcnM6IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KClcblx0XHR9O1xuXHRcdGNvbnN0IG9uVmlzaWJpbGl0eUNoYW5nZSA9ICgpID0+IHtcblx0XHRcdHZpc2liaWxpdHlNYW5hZ2VyLmN1cnJlbnRTdGF0ZSA9IGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZTtcblx0XHRcdGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdmlzaWJpbGl0eU1hbmFnZXIubGlzdGVuZXJzKSBsaXN0ZW5lcih2aXNpYmlsaXR5TWFuYWdlci5jdXJyZW50U3RhdGUpO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgb25WaXNpYmlsaXR5Q2hhbmdlKTtcblx0XHRyZXR1cm4gd2FpdEZvclN1Y2Nlc3NmdWxQaW5nSW50ZXJuYWwoc29ja2V0VXJsLCB2aXNpYmlsaXR5TWFuYWdlcik7XG5cdH1cblx0Y29uc3QgYmxvYiA9IG5ldyBCbG9iKFtcblx0XHRcIlxcXCJ1c2Ugc3RyaWN0XFxcIjtcIixcblx0XHRgY29uc3Qgd2FpdEZvclN1Y2Nlc3NmdWxQaW5nSW50ZXJuYWwgPSAke3dhaXRGb3JTdWNjZXNzZnVsUGluZ0ludGVybmFsLnRvU3RyaW5nKCl9O2AsXG5cdFx0YGNvbnN0IGZuID0gJHtwaW5nV29ya2VyQ29udGVudE1haW4udG9TdHJpbmcoKX07YCxcblx0XHRgZm4oJHtKU09OLnN0cmluZ2lmeShzb2NrZXRVcmwpfSlgXG5cdF0sIHsgdHlwZTogXCJhcHBsaWNhdGlvbi9qYXZhc2NyaXB0XCIgfSk7XG5cdGNvbnN0IG9ialVSTCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cdGNvbnN0IHNoYXJlZFdvcmtlciA9IG5ldyBTaGFyZWRXb3JrZXIob2JqVVJMKTtcblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjb25zdCBvblZpc2liaWxpdHlDaGFuZ2UgPSAoKSA9PiB7XG5cdFx0XHRzaGFyZWRXb3JrZXIucG9ydC5wb3N0TWVzc2FnZSh7IHZpc2liaWxpdHk6IGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSB9KTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ2aXNpYmlsaXR5Y2hhbmdlXCIsIG9uVmlzaWJpbGl0eUNoYW5nZSk7XG5cdFx0c2hhcmVkV29ya2VyLnBvcnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgKGV2ZW50KSA9PiB7XG5cdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCBvblZpc2liaWxpdHlDaGFuZ2UpO1xuXHRcdFx0c2hhcmVkV29ya2VyLnBvcnQuY2xvc2UoKTtcblx0XHRcdGNvbnN0IGRhdGEgPSBldmVudC5kYXRhO1xuXHRcdFx0aWYgKGRhdGEudHlwZSA9PT0gXCJlcnJvclwiKSB7XG5cdFx0XHRcdHJlamVjdChkYXRhLmVycm9yKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0cmVzb2x2ZSgpO1xuXHRcdH0pO1xuXHRcdG9uVmlzaWJpbGl0eUNoYW5nZSgpO1xuXHRcdHNoYXJlZFdvcmtlci5wb3J0LnN0YXJ0KCk7XG5cdH0pO1xufVxuZnVuY3Rpb24gcGluZ1dvcmtlckNvbnRlbnRNYWluKHNvY2tldFVybCkge1xuXHRzZWxmLmFkZEV2ZW50TGlzdGVuZXIoXCJjb25uZWN0XCIsIChfZXZlbnQpID0+IHtcblx0XHRjb25zdCBwb3J0ID0gX2V2ZW50LnBvcnRzWzBdO1xuXHRcdGlmICghc29ja2V0VXJsKSB7XG5cdFx0XHRwb3J0LnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0dHlwZTogXCJlcnJvclwiLFxuXHRcdFx0XHRlcnJvcjogLyogQF9fUFVSRV9fICovIG5ldyBFcnJvcihcInNvY2tldFVybCBub3QgZm91bmRcIilcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRjb25zdCB2aXNpYmlsaXR5TWFuYWdlciA9IHtcblx0XHRcdGN1cnJlbnRTdGF0ZTogXCJ2aXNpYmxlXCIsXG5cdFx0XHRsaXN0ZW5lcnM6IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KClcblx0XHR9O1xuXHRcdHBvcnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgKGV2ZW50KSA9PiB7XG5cdFx0XHRjb25zdCB7IHZpc2liaWxpdHkgfSA9IGV2ZW50LmRhdGE7XG5cdFx0XHR2aXNpYmlsaXR5TWFuYWdlci5jdXJyZW50U3RhdGUgPSB2aXNpYmlsaXR5O1xuXHRcdFx0Y29uc29sZS5kZWJ1ZyhcIlt2aXRlXSBuZXcgd2luZG93IHZpc2liaWxpdHlcIiwgdmlzaWJpbGl0eSk7XG5cdFx0XHRmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHZpc2liaWxpdHlNYW5hZ2VyLmxpc3RlbmVycykgbGlzdGVuZXIodmlzaWJpbGl0eSk7XG5cdFx0fSk7XG5cdFx0cG9ydC5zdGFydCgpO1xuXHRcdGNvbnNvbGUuZGVidWcoXCJbdml0ZV0gY29ubmVjdGVkIGZyb20gd2luZG93XCIpO1xuXHRcdHdhaXRGb3JTdWNjZXNzZnVsUGluZ0ludGVybmFsKHNvY2tldFVybCwgdmlzaWJpbGl0eU1hbmFnZXIpLnRoZW4oKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5kZWJ1ZyhcIlt2aXRlXSBwaW5nIHN1Y2Nlc3NmdWxcIik7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRwb3J0LnBvc3RNZXNzYWdlKHsgdHlwZTogXCJzdWNjZXNzXCIgfSk7XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRwb3J0LnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0XHR0eXBlOiBcImVycm9yXCIsXG5cdFx0XHRcdFx0ZXJyb3Jcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSwgKGVycm9yKSA9PiB7XG5cdFx0XHRjb25zb2xlLmRlYnVnKFwiW3ZpdGVdIGVycm9yIGhhcHBlbmVkXCIsIGVycm9yKTtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHBvcnQucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHRcdHR5cGU6IFwiZXJyb3JcIixcblx0XHRcdFx0XHRlcnJvclxuXHRcdFx0XHR9KTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yJDEpIHtcblx0XHRcdFx0cG9ydC5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdFx0dHlwZTogXCJlcnJvclwiLFxuXHRcdFx0XHRcdGVycm9yOiBlcnJvciQxXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcbn1cbmFzeW5jIGZ1bmN0aW9uIHdhaXRGb3JTdWNjZXNzZnVsUGluZ0ludGVybmFsKHNvY2tldFVybCwgdmlzaWJpbGl0eU1hbmFnZXIsIG1zID0gMWUzKSB7XG5cdGZ1bmN0aW9uIHdhaXQobXMkMSkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcyQxKSk7XG5cdH1cblx0YXN5bmMgZnVuY3Rpb24gcGluZygpIHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgc29ja2V0ID0gbmV3IFdlYlNvY2tldChzb2NrZXRVcmwsIFwidml0ZS1waW5nXCIpO1xuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRcdGZ1bmN0aW9uIG9uT3BlbigpIHtcblx0XHRcdFx0XHRyZXNvbHZlKHRydWUpO1xuXHRcdFx0XHRcdGNsb3NlKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZnVuY3Rpb24gb25FcnJvcigpIHtcblx0XHRcdFx0XHRyZXNvbHZlKGZhbHNlKTtcblx0XHRcdFx0XHRjbG9zZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGZ1bmN0aW9uIGNsb3NlKCkge1xuXHRcdFx0XHRcdHNvY2tldC5yZW1vdmVFdmVudExpc3RlbmVyKFwib3BlblwiLCBvbk9wZW4pO1xuXHRcdFx0XHRcdHNvY2tldC5yZW1vdmVFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgb25FcnJvcik7XG5cdFx0XHRcdFx0c29ja2V0LmNsb3NlKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0c29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJvcGVuXCIsIG9uT3Blbik7XG5cdFx0XHRcdHNvY2tldC5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgb25FcnJvcik7XG5cdFx0XHR9KTtcblx0XHR9IGNhdGNoIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblx0ZnVuY3Rpb24gd2FpdEZvcldpbmRvd1Nob3codmlzaWJpbGl0eU1hbmFnZXIkMSkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0Y29uc3Qgb25DaGFuZ2UgPSAobmV3VmlzaWJpbGl0eSkgPT4ge1xuXHRcdFx0XHRpZiAobmV3VmlzaWJpbGl0eSA9PT0gXCJ2aXNpYmxlXCIpIHtcblx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdFx0dmlzaWJpbGl0eU1hbmFnZXIkMS5saXN0ZW5lcnMuZGVsZXRlKG9uQ2hhbmdlKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdHZpc2liaWxpdHlNYW5hZ2VyJDEubGlzdGVuZXJzLmFkZChvbkNoYW5nZSk7XG5cdFx0fSk7XG5cdH1cblx0aWYgKGF3YWl0IHBpbmcoKSkgcmV0dXJuO1xuXHRhd2FpdCB3YWl0KG1zKTtcblx0d2hpbGUgKHRydWUpIGlmICh2aXNpYmlsaXR5TWFuYWdlci5jdXJyZW50U3RhdGUgPT09IFwidmlzaWJsZVwiKSB7XG5cdFx0aWYgKGF3YWl0IHBpbmcoKSkgYnJlYWs7XG5cdFx0YXdhaXQgd2FpdChtcyk7XG5cdH0gZWxzZSBhd2FpdCB3YWl0Rm9yV2luZG93U2hvdyh2aXNpYmlsaXR5TWFuYWdlcik7XG59XG5jb25zdCBzaGVldHNNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuaWYgKFwiZG9jdW1lbnRcIiBpbiBnbG9iYWxUaGlzKSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwic3R5bGVbZGF0YS12aXRlLWRldi1pZF1cIikuZm9yRWFjaCgoZWwpID0+IHtcblx0c2hlZXRzTWFwLnNldChlbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXZpdGUtZGV2LWlkXCIpLCBlbCk7XG59KTtcbmNvbnN0IGNzcE5vbmNlID0gXCJkb2N1bWVudFwiIGluIGdsb2JhbFRoaXMgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwibWV0YVtwcm9wZXJ0eT1jc3Atbm9uY2VdXCIpPy5ub25jZSA6IHZvaWQgMDtcbmxldCBsYXN0SW5zZXJ0ZWRTdHlsZTtcbmZ1bmN0aW9uIHVwZGF0ZVN0eWxlKGlkLCBjb250ZW50KSB7XG5cdGxldCBzdHlsZSA9IHNoZWV0c01hcC5nZXQoaWQpO1xuXHRpZiAoIXN0eWxlKSB7XG5cdFx0c3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG5cdFx0c3R5bGUuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcInRleHQvY3NzXCIpO1xuXHRcdHN0eWxlLnNldEF0dHJpYnV0ZShcImRhdGEtdml0ZS1kZXYtaWRcIiwgaWQpO1xuXHRcdHN0eWxlLnRleHRDb250ZW50ID0gY29udGVudDtcblx0XHRpZiAoY3NwTm9uY2UpIHN0eWxlLnNldEF0dHJpYnV0ZShcIm5vbmNlXCIsIGNzcE5vbmNlKTtcblx0XHRpZiAoIWxhc3RJbnNlcnRlZFN0eWxlKSB7XG5cdFx0XHRkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcblx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHRsYXN0SW5zZXJ0ZWRTdHlsZSA9IHZvaWQgMDtcblx0XHRcdH0sIDApO1xuXHRcdH0gZWxzZSBsYXN0SW5zZXJ0ZWRTdHlsZS5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJhZnRlcmVuZFwiLCBzdHlsZSk7XG5cdFx0bGFzdEluc2VydGVkU3R5bGUgPSBzdHlsZTtcblx0fSBlbHNlIHN0eWxlLnRleHRDb250ZW50ID0gY29udGVudDtcblx0c2hlZXRzTWFwLnNldChpZCwgc3R5bGUpO1xufVxuZnVuY3Rpb24gcmVtb3ZlU3R5bGUoaWQpIHtcblx0Y29uc3Qgc3R5bGUgPSBzaGVldHNNYXAuZ2V0KGlkKTtcblx0aWYgKHN0eWxlKSB7XG5cdFx0ZG9jdW1lbnQuaGVhZC5yZW1vdmVDaGlsZChzdHlsZSk7XG5cdFx0c2hlZXRzTWFwLmRlbGV0ZShpZCk7XG5cdH1cbn1cbmZ1bmN0aW9uIGNyZWF0ZUhvdENvbnRleHQob3duZXJQYXRoKSB7XG5cdHJldHVybiBuZXcgSE1SQ29udGV4dChobXJDbGllbnQsIG93bmVyUGF0aCk7XG59XG4vKipcbiogdXJscyBoZXJlIGFyZSBkeW5hbWljIGltcG9ydCgpIHVybHMgdGhhdCBjb3VsZG4ndCBiZSBzdGF0aWNhbGx5IGFuYWx5emVkXG4qL1xuZnVuY3Rpb24gaW5qZWN0UXVlcnkodXJsLCBxdWVyeVRvSW5qZWN0KSB7XG5cdGlmICh1cmxbMF0gIT09IFwiLlwiICYmIHVybFswXSAhPT0gXCIvXCIpIHJldHVybiB1cmw7XG5cdGNvbnN0IHBhdGhuYW1lID0gdXJsLnJlcGxhY2UoL1s/I10uKiQvLCBcIlwiKTtcblx0Y29uc3QgeyBzZWFyY2gsIGhhc2ggfSA9IG5ldyBVUkwodXJsLCBcImh0dHA6Ly92aXRlLmRldlwiKTtcblx0cmV0dXJuIGAke3BhdGhuYW1lfT8ke3F1ZXJ5VG9JbmplY3R9JHtzZWFyY2ggPyBgJmAgKyBzZWFyY2guc2xpY2UoMSkgOiBcIlwifSR7aGFzaCB8fCBcIlwifWA7XG59XG5cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgRXJyb3JPdmVybGF5LCBjcmVhdGVIb3RDb250ZXh0LCBpbmplY3RRdWVyeSwgcmVtb3ZlU3R5bGUsIHVwZGF0ZVN0eWxlIH07Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQzs7QUFFM0QsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUN4SCxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUMxQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BHLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3SCxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDZDs7QUFFQSxDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7QUFDN0gsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDM0MsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztBQUM5QixDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNuQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN0QyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3JFLENBQUM7QUFDRCxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFD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QUFVLENBQUMsQ0FBQyxDQUFDO0FBQ3BELENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTO0FBQ3ZCLENBQUMsQ0FBQyxDQUFDLE9BQU87QUFDVixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTO0FBQ3ZCLENBQUMsQ0FBQyxDQUFDLE9BQU87QUFDVixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0YsQ0FBQztBQUNELENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2YsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FB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O0FBQ0wsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDO0FBQ0QsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7QUFDdkYsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN6SSxDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxD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Q0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDM0ksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDOUMsQ0FBQyxNQUFNLENBQUM7QUFDUixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDaEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUM5QixDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN2QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDdkUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUk7QUFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN4QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0FBQ2hELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNO0FBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO0FBQzdELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJO0FBQzFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDdkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNO0FBQ2IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztBQUN2QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENB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Q0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSztBQUN0QixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDekMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNWLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTTtBQUN4QyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsS0FBSyxDQUFDLGlCQUFpQjtBQUNuRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDekQsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDdkMsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsS0FBSyxDQUFDLGlCQUFpQjtBQUNuRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDM0QsQ0FBQyxDQUFDLENBQUMsTUFBTSxD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QUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNiLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDbEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDO0FBQzVCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUM5QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU07QUFDZCxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztBQUNuQixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQ2YsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQztBQUNoQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNkLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNiLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNoQyxDQUFDLENBQUM7QUFDRixDQUFDLENBQUM7QUFDRixDQUFDOztBQUVELENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO0FBQ2hDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNuQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMxQixDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzFEO0FBQ0EsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ2xCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztBQUNmLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUN6QyxDQUFDO0FBQ0QsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDbEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7QUFDbkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPO0FBQ1gsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPO0FBQ1gsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNqQixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUNELENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNYLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUs7QUFDaEMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUs7QUFDekIsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDckIsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9B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Q0FBQyxJQUFJO0FBQ1osQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNmLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLO0FBQ2IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNmLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLO0FBQ2IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUNiLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQ1gsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ25YLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdELEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUM5RCxLQUFLLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVTtBQUM3QyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQztBQUM3QyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNULENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDdkMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM3QyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakQsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFDekMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO0FBQzNELENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPO0FBQy9FLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzVDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNyRixDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUMzQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDckQsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUN2QyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQ3RCLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDZixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUQsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ3ZELENBQUM7QUFDRCxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7QUFDOUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSTtBQUN2QyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ1AsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSztBQUNaLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDcEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUM1QyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqRCxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbEcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTTtBQUN6QyxDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDNUYsQ0FBQyxDQUFDO0FBQ0YsQ0FBQztBQUNELENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNULENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztBQUNwQyxDQUFDLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQzFELENBQUM7QUFDRCxDQUFDO0FBQ0QsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztBQUN0QyxLQUFLLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVU7QUFDckMsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsWUFBWSxDQUFDOztBQUVwRyxDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUM1QixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQzlDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDaEQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNuRixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ3BCLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdEQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25DLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDeEIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7QUFDOUIsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4RCxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLG9DQUFvQyxDQUFDO0FBQ3hELENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN6RyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLE1BQU0sQ0FBQztBQUNSLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO0FBQ3ZDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNmLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxvQ0FBb0MsQ0FBQztBQUN4RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ25ILENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ1QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO0FBQ3pDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUM1SyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDNUQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hILENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVM7QUFDM0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLO0FBQ2xCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcFEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTTtBQUNYLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ1gsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztBQUNyQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNiLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ3pCLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDdEIsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuRixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSTtBQUNsQixDQUFDLENBQUM7QUFDRixRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzVCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2pELENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNsQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTTtBQUNqQztBQUNBLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUk7QUFDeEIsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDdEQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQyxDQUFDLEdBQUcsQ0FBQyxLQUFLO0FBQ1YsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZCxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDYixDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO0FBQ3RCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSTtBQUNmLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNWLENBQUMsQ0FBQztBQUNGLENBQUM7QUFDRCxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO0FBQ3JDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7QUFDaEMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDN0MsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQ2xELENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUgsQ0FBQyxLQUFLLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxNQUFNO0FBQzdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNuQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsSSxDQUFDO0FBQ0QsQ0FBQyxFQUFFLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3RSLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNkLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWE7QUFDM0IsQ0FBQyxDQUFDO0FBQ0YsU0FBUyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNsRCxLQUFLLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN0QyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN2QixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ2xCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsS0FBSztBQUNSLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDZixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUNoRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVELENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3JCLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTTtBQUNWLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDVixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDMUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDekIsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQztBQUN6RSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTTtBQUN0QyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7QUFDcEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUMxSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTTtBQUNuQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN0RyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN0QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSTtBQUNyRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2pCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDM0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENB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QUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7QUFDckIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ2xCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDbEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQztBQUNIO0FBQ0EsS0FBSyxDQUFDLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDckYsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFDRCxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN2QixDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN2RCxDQUFDLENBQUMsQ0FB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Q0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRztBQUNqRCxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekQsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekY7O0FBRUEsQ0FBQyxDQUFDLENBQUM7QUFDSCxNQUFNLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMifQ==