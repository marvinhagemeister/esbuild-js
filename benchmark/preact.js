var EMPTY_OBJ = {};
var EMPTY_ARR = [];
var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;

/**
 * Assign properties from `props` to `obj`
 * @template O, P The obj and props types
 * @param {O} obj The object to copy properties to
 * @param {P} props The object to copy properties from
 * @returns {O & P}
 */
function assign(obj, props) {
	for (var i in props) {
		obj[i] = props[i];
	}

	return (
		/** @type {O & P} */
		obj
	);
}
/**
 * Remove a child node from its parent if attached. This is a workaround for
 * IE11 which doesn't support `Element.prototype.remove()`. Using this function
 * is smaller than including a dedicated polyfill.
 * @param {Node} node The node to remove
 */

function removeNode(node) {
	var parentNode = node.parentNode;
	if (parentNode) {
		parentNode.removeChild(node);
	}
}

// import { enqueueRender } from '../component';

/**
 * Find the closest error boundary to a thrown error and call it
 * @param {object} error The thrown value
 * @param {import('../internal').VNode} vnode The vnode that threw
 * the error that was caught (except for unmounting when this parameter
 * is the highest parent that was being unmounted)
 */
function _catchError(error, vnode) {
	/** @type {import('../internal').Component} */
	var component, ctor, handled;
	var wasHydrating = vnode.__h;

	for (; (vnode = vnode.__); ) {
		if ((component = vnode.__c) && !component.__) {
			try {
				ctor = component.constructor;

				if (ctor && ctor.getDerivedStateFromError != null) {
					component.setState(ctor.getDerivedStateFromError(error));
					handled = component.__d;
				}

				if (component.componentDidCatch != null) {
					component.componentDidCatch(error);
					handled = component.__d;
				} // This is an error boundary. Mark it as having bailed out, and whether it was mid-hydration.

				if (handled) {
					vnode.__h = wasHydrating;
					return (component.__E = component);
				}
			} catch (e) {
				error = e;
			}
		}
	}

	throw error;
}

/**
 * The `option` object can potentially contain callback functions
 * that are called during various stages of our renderer. This is the
 * foundation on which all our addons like `preact/debug`, `preact/compat`,
 * and `preact/hooks` are based on. See the `Options` type in `internal.d.ts`
 * for a full list of available option hooks (most editors/IDEs allow you to
 * ctrl+click or cmd+click on mac the type definition below).
 * @type {import('./internal').Options}
 */

var options = {
	__e: _catchError,
};

/**
 * Create an virtual node (used for JSX)
 * @param {import('./internal').VNode["type"]} type The node name or Component
 * constructor for this virtual node
 * @param {object | null | undefined} [props] The properties of the virtual node
 * @param {Array<import('.').ComponentChildren>} [children] The children of the virtual node
 * @returns {import('./internal').VNode}
 */

function createElement(type, props, children) {
	var arguments$1 = arguments;

	var normalizedProps = {},
		key,
		ref,
		i;

	for (i in props) {
		if (i == "key") {
			key = props[i];
		} else if (i == "ref") {
			ref = props[i];
		} else {
			normalizedProps[i] = props[i];
		}
	}

	if (arguments.length > 3) {
		children = [children]; // https://github.com/preactjs/preact/issues/1916

		for (i = 3; i < arguments.length; i++) {
			children.push(arguments$1[i]);
		}
	}

	if (children != null) {
		normalizedProps.children = children;
	} // If a Component VNode, check for and apply defaultProps
	// Note: type may be undefined in development, must never error here.

	if (typeof type == "function" && type.defaultProps != null) {
		for (i in type.defaultProps) {
			if (normalizedProps[i] === undefined) {
				normalizedProps[i] = type.defaultProps[i];
			}
		}
	}

	return createVNode(type, normalizedProps, key, ref, null);
}
/**
 * Create a VNode (used internally by Preact)
 * @param {import('./internal').VNode["type"]} type The node name or Component
 * Constructor for this virtual node
 * @param {object | string | number | null} props The properties of this virtual node.
 * If this virtual node represents a text node, this is the text of the node (string or number).
 * @param {string | number | null} key The key for this virtual node, used when
 * diffing it against its children
 * @param {import('./internal').VNode["ref"]} ref The ref property that will
 * receive a reference to its created child
 * @returns {import('./internal').VNode}
 */

function createVNode(type, props, key, ref, original) {
	// V8 seems to be better at detecting type shapes if the object is allocated from the same call site
	// Do not inline into createElement and coerceToVNode!
	var vnode = {
		type: type,
		props: props,
		key: key,
		ref: ref,
		__k: null,
		__: null,
		__b: 0,
		__e: null,
		// _nextDom must be initialized to undefined b/c it will eventually
		// be set to dom.nextSibling which can return `null` and it is important
		// to be able to distinguish between an uninitialized _nextDom and
		// a _nextDom that has been set to `null`
		__d: undefined,
		__c: null,
		__h: null,
		constructor: undefined,
		__v: original,
	};
	if (original == null) {
		vnode.__v = vnode;
	}
	if (options.vnode != null) {
		options.vnode(vnode);
	}
	return vnode;
}
function createRef() {
	return {
		current: null,
	};
}
function Fragment(props) {
	return props.children;
}
/**
 * Check if a the argument is a valid Preact VNode.
 * @param {*} vnode
 * @returns {vnode is import('./internal').VNode}
 */

var isValidElement = function isValidElement(vnode) {
	return vnode != null && vnode.constructor === undefined;
};

/**
 * Base Component class. Provides `setState()` and `forceUpdate()`, which
 * trigger rendering
 * @param {object} props The initial component props
 * @param {object} context The initial context from parent components'
 * getChildContext
 */

function Component(props, context) {
	this.props = props;
	this.context = context;
}
/**
 * Update component state and schedule a re-render.
 * @param {object | ((s: object, p: object) => object)} update A hash of state
 * properties to update with new values or a function that given the current
 * state and props returns a new partial state
 * @param {() => void} [callback] A function to be called once component state is
 * updated
 */

Component.prototype.setState = function (update, callback) {
	// only clone state when copying to nextState the first time.
	var s;

	if (this.__s != null && this.__s !== this.state) {
		s = this.__s;
	} else {
		s = this.__s = assign({}, this.state);
	}

	if (typeof update == "function") {
		// Some libraries like `immer` mark the current state as readonly,
		// preventing us from mutating it, so we need to clone it. See #2716
		update = update(assign({}, s), this.props);
	}

	if (update) {
		assign(s, update);
	} // Skip update if updater function returned null

	if (update == null) {
		return;
	}

	if (this.__v) {
		if (callback) {
			this.__h.push(callback);
		}
		enqueueRender(this);
	}
};
/**
 * Immediately perform a synchronous re-render of the component
 * @param {() => void} [callback] A function to be called after component is
 * re-rendered
 */

Component.prototype.forceUpdate = function (callback) {
	if (this.__v) {
		// Set render mode so that we can differentiate where the render request
		// is coming from. We need this because forceUpdate should never call
		// shouldComponentUpdate
		this.__e = true;
		if (callback) {
			this.__h.push(callback);
		}
		enqueueRender(this);
	}
};
/**
 * Accepts `props` and `state`, and returns a new Virtual DOM tree to build.
 * Virtual DOM is generally constructed via [JSX](http://jasonformat.com/wtf-is-jsx).
 * @param {object} props Props (eg: JSX attributes) received from parent
 * element/component
 * @param {object} state The component's current state
 * @param {object} context Context object, as returned by the nearest
 * ancestor's `getChildContext()`
 * @returns {import('./index').ComponentChildren | void}
 */

Component.prototype.render = Fragment;
/**
 * @param {import('./internal').VNode} vnode
 * @param {number | null} [childIndex]
 */

function getDomSibling(vnode, childIndex) {
	if (childIndex == null) {
		// Use childIndex==null as a signal to resume the search from the vnode's sibling
		return vnode.__
			? getDomSibling(vnode.__, vnode.__.__k.indexOf(vnode) + 1)
			: null;
	}

	var sibling;

	for (; childIndex < vnode.__k.length; childIndex++) {
		sibling = vnode.__k[childIndex];

		if (sibling != null && sibling.__e != null) {
			// Since updateParentDomPointers keeps _dom pointer correct,
			// we can rely on _dom to tell us if this subtree contains a
			// rendered DOM node, and what the first rendered DOM node is
			return sibling.__e;
		}
	} // If we get here, we have not found a DOM node in this vnode's children.
	// We must resume from this vnode's sibling (in it's parent _children array)
	// Only climb up and search the parent if we aren't searching through a DOM
	// VNode (meaning we reached the DOM parent of the original vnode that began
	// the search)

	return typeof vnode.type == "function" ? getDomSibling(vnode) : null;
}
/**
 * Trigger in-place re-rendering of a component.
 * @param {import('./internal').Component} component The component to rerender
 */

function renderComponent(component) {
	var vnode = component.__v,
		oldDom = vnode.__e,
		parentDom = component.__P;

	if (parentDom) {
		var commitQueue = [];
		var oldVNode = assign({}, vnode);
		oldVNode.__v = oldVNode;
		var newDom = diff(
			parentDom,
			vnode,
			oldVNode,
			component.__n,
			parentDom.ownerSVGElement !== undefined,
			vnode.__h != null ? [oldDom] : null,
			commitQueue,
			oldDom == null ? getDomSibling(vnode) : oldDom,
			vnode.__h
		);
		commitRoot(commitQueue, vnode);

		if (newDom != oldDom) {
			updateParentDomPointers(vnode);
		}
	}
}
/**
 * @param {import('./internal').VNode} vnode
 */

function updateParentDomPointers(vnode) {
	if ((vnode = vnode.__) != null && vnode.__c != null) {
		vnode.__e = vnode.__c.base = null;

		for (var i = 0; i < vnode.__k.length; i++) {
			var child = vnode.__k[i];

			if (child != null && child.__e != null) {
				vnode.__e = vnode.__c.base = child.__e;
				break;
			}
		}

		return updateParentDomPointers(vnode);
	}
}
/**
 * The render queue
 * @type {Array<import('./internal').Component>}
 */

var rerenderQueue = [];
/**
 * Asynchronously schedule a callback
 * @type {(cb: () => void) => void}
 */

/* istanbul ignore next */
// Note the following line isn't tree-shaken by rollup cuz of rollup/rollup#2566

var defer =
	typeof Promise == "function"
		? Promise.prototype.then.bind(Promise.resolve())
		: setTimeout;
/*
 * The value of `Component.debounce` must asynchronously invoke the passed in callback. It is
 * important that contributors to Preact can consistently reason about what calls to `setState`, etc.
 * do, and when their effects will be applied. See the links below for some further reading on designing
 * asynchronous APIs.
 * * [Designing APIs for Asynchrony](https://blog.izs.me/2013/08/designing-apis-for-asynchrony)
 * * [Callbacks synchronous and asynchronous](https://blog.ometer.com/2011/07/24/callbacks-synchronous-and-asynchronous/)
 */

var prevDebounce;
/**
 * Enqueue a rerender of a component
 * @param {import('./internal').Component} c The component to rerender
 */

function enqueueRender(c) {
	if (
		(!c.__d && (c.__d = true) && rerenderQueue.push(c) && !process.__r++) ||
		prevDebounce !== options.debounceRendering
	) {
		prevDebounce = options.debounceRendering;
		(prevDebounce || defer)(process);
	}
}
/** Flush the render queue by rerendering all queued components */

function process() {
	var queue;

	while ((process.__r = rerenderQueue.length)) {
		queue = rerenderQueue.sort(function (a, b) {
			return a.__v.__b - b.__v.__b;
		});
		rerenderQueue = []; // Don't update `renderCount` yet. Keep its value non-zero to prevent unnecessary
		// process() calls from getting scheduled while `queue` is still being consumed.

		queue.some(function (c) {
			if (c.__d) {
				renderComponent(c);
			}
		});
	}
}

process.__r = 0;

/**
 * Diff the children of a virtual node
 * @param {import('../internal').PreactElement} parentDom The DOM element whose
 * children are being diffed
 * @param {import('../index').ComponentChildren[]} renderResult
 * @param {import('../internal').VNode} newParentVNode The new virtual
 * node whose children should be diff'ed against oldParentVNode
 * @param {import('../internal').VNode} oldParentVNode The old virtual
 * node whose children should be diff'ed against newParentVNode
 * @param {object} globalContext The current context object - modified by getChildContext
 * @param {boolean} isSvg Whether or not this DOM node is an SVG node
 * @param {Array<import('../internal').PreactElement>} excessDomChildren
 * @param {Array<import('../internal').Component>} commitQueue List of components
 * which have callbacks to invoke in commitRoot
 * @param {Node | Text} oldDom The current attached DOM
 * element any new dom elements should be placed around. Likely `null` on first
 * render (except when hydrating). Can be a sibling DOM element when diffing
 * Fragments that have siblings. In most cases, it starts out as `oldChildren[0]._dom`.
 * @param {boolean} isHydrating Whether or not we are in hydration
 */

function diffChildren(
	parentDom,
	renderResult,
	newParentVNode,
	oldParentVNode,
	globalContext,
	isSvg,
	excessDomChildren,
	commitQueue,
	oldDom,
	isHydrating
) {
	var i, j, oldVNode, childVNode, newDom, firstChildDom, refs; // This is a compression of oldParentVNode!=null && oldParentVNode != EMPTY_OBJ && oldParentVNode._children || EMPTY_ARR
	// as EMPTY_OBJ._children should be `undefined`.

	var oldChildren = (oldParentVNode && oldParentVNode.__k) || EMPTY_ARR;
	var oldChildrenLength = oldChildren.length; // Only in very specific places should this logic be invoked (top level `render` and `diffElementNodes`).
	// I'm using `EMPTY_OBJ` to signal when `diffChildren` is invoked in these situations. I can't use `null`
	// for this purpose, because `null` is a valid value for `oldDom` which can mean to skip to this logic
	// (e.g. if mounting a new tree in which the old DOM should be ignored (usually for Fragments).

	if (oldDom == EMPTY_OBJ) {
		if (excessDomChildren != null) {
			oldDom = excessDomChildren[0];
		} else if (oldChildrenLength) {
			oldDom = getDomSibling(oldParentVNode, 0);
		} else {
			oldDom = null;
		}
	}

	newParentVNode.__k = [];

	for (i = 0; i < renderResult.length; i++) {
		childVNode = renderResult[i];

		if (childVNode == null || typeof childVNode == "boolean") {
			childVNode = newParentVNode.__k[i] = null;
		} // If this newVNode is being reused (e.g. <div>{reuse}{reuse}</div>) in the same diff,
		// or we are rendering a component (e.g. setState) copy the oldVNodes so it can have
		// it's own DOM & etc. pointers
		else if (typeof childVNode == "string" || typeof childVNode == "number") {
			childVNode = newParentVNode.__k[i] = createVNode(
				null,
				childVNode,
				null,
				null,
				childVNode
			);
		} else if (Array.isArray(childVNode)) {
			childVNode = newParentVNode.__k[i] = createVNode(
				Fragment,
				{
					children: childVNode,
				},
				null,
				null,
				null
			);
		} else if (childVNode.__e != null || childVNode.__c != null) {
			childVNode = newParentVNode.__k[i] = createVNode(
				childVNode.type,
				childVNode.props,
				childVNode.key,
				null,
				childVNode.__v
			);
		} else {
			childVNode = newParentVNode.__k[i] = childVNode;
		} // Terser removes the `continue` here and wraps the loop body
		// in a `if (childVNode) { ... } condition

		if (childVNode == null) {
			continue;
		}

		childVNode.__ = newParentVNode;
		childVNode.__b = newParentVNode.__b + 1; // Check if we find a corresponding element in oldChildren.
		// If found, delete the array item by setting to `undefined`.
		// We use `undefined`, as `null` is reserved for empty placeholders
		// (holes).

		oldVNode = oldChildren[i];

		if (
			oldVNode === null ||
			(oldVNode &&
				childVNode.key == oldVNode.key &&
				childVNode.type === oldVNode.type)
		) {
			oldChildren[i] = undefined;
		} else {
			// Either oldVNode === undefined or oldChildrenLength > 0,
			// so after this loop oldVNode == null or oldVNode is a valid value.
			for (j = 0; j < oldChildrenLength; j++) {
				oldVNode = oldChildren[j]; // If childVNode is unkeyed, we only match similarly unkeyed nodes, otherwise we match by key.
				// We always match by type (in either case).

				if (
					oldVNode &&
					childVNode.key == oldVNode.key &&
					childVNode.type === oldVNode.type
				) {
					oldChildren[j] = undefined;
					break;
				}

				oldVNode = null;
			}
		}

		oldVNode = oldVNode || EMPTY_OBJ; // Morph the old element into the new one, but don't append it to the dom yet

		newDom = diff(
			parentDom,
			childVNode,
			oldVNode,
			globalContext,
			isSvg,
			excessDomChildren,
			commitQueue,
			oldDom,
			isHydrating
		);

		if ((j = childVNode.ref) && oldVNode.ref != j) {
			if (!refs) {
				refs = [];
			}
			if (oldVNode.ref) {
				refs.push(oldVNode.ref, null, childVNode);
			}
			refs.push(j, childVNode.__c || newDom, childVNode);
		}

		if (newDom != null) {
			if (firstChildDom == null) {
				firstChildDom = newDom;
			}

			oldDom = placeChild(
				parentDom,
				childVNode,
				oldVNode,
				oldChildren,
				excessDomChildren,
				newDom,
				oldDom
			); // Browsers will infer an option's `value` from `textContent` when
			// no value is present. This essentially bypasses our code to set it
			// later in `diff()`. It works fine in all browsers except for IE11
			// where it breaks setting `select.value`. There it will be always set
			// to an empty string. Re-applying an options value will fix that, so
			// there are probably some internal data structures that aren't
			// updated properly.
			//
			// To fix it we make sure to reset the inferred value, so that our own
			// value check in `diff()` won't be skipped.

			if (!isHydrating && newParentVNode.type == "option") {
				parentDom.value = "";
			} else if (typeof newParentVNode.type == "function") {
				// Because the newParentVNode is Fragment-like, we need to set it's
				// _nextDom property to the nextSibling of its last child DOM node.
				//
				// `oldDom` contains the correct value here because if the last child
				// is a Fragment-like, then oldDom has already been set to that child's _nextDom.
				// If the last child is a DOM VNode, then oldDom will be set to that DOM
				// node's nextSibling.
				newParentVNode.__d = oldDom;
			}
		} else if (
			oldDom &&
			oldVNode.__e == oldDom &&
			oldDom.parentNode != parentDom
		) {
			// The above condition is to handle null placeholders. See test in placeholder.test.js:
			// `efficiently replace null placeholders in parent rerenders`
			oldDom = getDomSibling(oldVNode);
		}
	}

	newParentVNode.__e = firstChildDom; // Remove children that are not part of any vnode.

	if (excessDomChildren != null && typeof newParentVNode.type != "function") {
		for (i = excessDomChildren.length; i--; ) {
			if (excessDomChildren[i] != null) {
				removeNode(excessDomChildren[i]);
			}
		}
	} // Remove remaining oldChildren if there are any.

	for (i = oldChildrenLength; i--; ) {
		if (oldChildren[i] != null) {
			unmount(oldChildren[i], oldChildren[i]);
		}
	} // Set refs only after unmount

	if (refs) {
		for (i = 0; i < refs.length; i++) {
			applyRef(refs[i], refs[++i], refs[++i]);
		}
	}
}
/**
 * Flatten and loop through the children of a virtual node
 * @param {import('../index').ComponentChildren} children The unflattened
 * children of a virtual node
 * @returns {import('../internal').VNode[]}
 */

function toChildArray(children, out) {
	out = out || [];

	if (children == null || typeof children == "boolean");
	else if (Array.isArray(children)) {
		children.some(function (child) {
			toChildArray(child, out);
		});
	} else {
		out.push(children);
	}

	return out;
}
function placeChild(
	parentDom,
	childVNode,
	oldVNode,
	oldChildren,
	excessDomChildren,
	newDom,
	oldDom
) {
	var nextDom;

	if (childVNode.__d !== undefined) {
		// Only Fragments or components that return Fragment like VNodes will
		// have a non-undefined _nextDom. Continue the diff from the sibling
		// of last DOM child of this child VNode
		nextDom = childVNode.__d; // Eagerly cleanup _nextDom. We don't need to persist the value because
		// it is only used by `diffChildren` to determine where to resume the diff after
		// diffing Components and Fragments. Once we store it the nextDOM local var, we
		// can clean up the property

		childVNode.__d = undefined;
	} else if (
		excessDomChildren == oldVNode ||
		newDom != oldDom ||
		newDom.parentNode == null
	) {
		// NOTE: excessDomChildren==oldVNode above:
		// This is a compression of excessDomChildren==null && oldVNode==null!
		// The values only have the same type when `null`.
		outer: if (oldDom == null || oldDom.parentNode !== parentDom) {
			parentDom.appendChild(newDom);
			nextDom = null;
		} else {
			// `j<oldChildrenLength; j+=2` is an alternative to `j++<oldChildrenLength/2`
			for (
				var sibDom = oldDom, j = 0;
				(sibDom = sibDom.nextSibling) && j < oldChildren.length;
				j += 2
			) {
				if (sibDom == newDom) {
					break outer;
				}
			}

			parentDom.insertBefore(newDom, oldDom);
			nextDom = oldDom;
		}
	} // If we have pre-calculated the nextDOM node, use it. Else calculate it now
	// Strictly check for `undefined` here cuz `null` is a valid value of `nextDom`.
	// See more detail in create-element.js:createVNode

	if (nextDom !== undefined) {
		oldDom = nextDom;
	} else {
		oldDom = newDom.nextSibling;
	}

	return oldDom;
}

/**
 * Diff the old and new properties of a VNode and apply changes to the DOM node
 * @param {import('../internal').PreactElement} dom The DOM node to apply
 * changes to
 * @param {object} newProps The new props
 * @param {object} oldProps The old props
 * @param {boolean} isSvg Whether or not this node is an SVG node
 * @param {boolean} hydrate Whether or not we are in hydration mode
 */

function diffProps(dom, newProps, oldProps, isSvg, hydrate) {
	var i;

	for (i in oldProps) {
		if (i !== "children" && i !== "key" && !(i in newProps)) {
			setProperty(dom, i, null, oldProps[i], isSvg);
		}
	}

	for (i in newProps) {
		if (
			(!hydrate || typeof newProps[i] == "function") &&
			i !== "children" &&
			i !== "key" &&
			i !== "value" &&
			i !== "checked" &&
			oldProps[i] !== newProps[i]
		) {
			setProperty(dom, i, newProps[i], oldProps[i], isSvg);
		}
	}
}

function setStyle(style, key, value) {
	if (key[0] === "-") {
		style.setProperty(key, value);
	} else if (value == null) {
		style[key] = "";
	} else if (typeof value != "number" || IS_NON_DIMENSIONAL.test(key)) {
		style[key] = value;
	} else {
		style[key] = value + "px";
	}
}
/**
 * Set a property value on a DOM node
 * @param {import('../internal').PreactElement} dom The DOM node to modify
 * @param {string} name The name of the property to set
 * @param {*} value The value to set the property to
 * @param {*} oldValue The old value the property had
 * @param {boolean} isSvg Whether or not this DOM node is an SVG node or not
 */

function setProperty(dom, name, value, oldValue, isSvg) {
	var useCapture, nameLower, proxy;
	if (isSvg && name == "className") {
		name = "class";
	} // if (isSvg) {
	// 	if (name === 'className') name = 'class';
	// } else if (name === 'class') name += 'Name';

	if (name === "style") {
		if (typeof value == "string") {
			dom.style.cssText = value;
		} else {
			if (typeof oldValue == "string") {
				dom.style.cssText = oldValue = "";
			}

			if (oldValue) {
				for (name in oldValue) {
					if (!(value && name in value)) {
						setStyle(dom.style, name, "");
					}
				}
			}

			if (value) {
				for (name in value) {
					if (!oldValue || value[name] !== oldValue[name]) {
						setStyle(dom.style, name, value[name]);
					}
				}
			}
		}
	} // Benchmark for comparison: https://esbench.com/bench/574c954bdb965b9a00965ac6
	else if (name[0] === "o" && name[1] === "n") {
		useCapture = name !== (name = name.replace(/Capture$/, ""));
		nameLower = name.toLowerCase();
		if (nameLower in dom) {
			name = nameLower;
		}
		name = name.slice(2);
		if (!dom._listeners) {
			dom._listeners = {};
		}
		dom._listeners[name + useCapture] = value;
		proxy = useCapture ? eventProxyCapture : eventProxy;

		if (value) {
			if (!oldValue) {
				dom.addEventListener(name, proxy, useCapture);
			}
		} else {
			dom.removeEventListener(name, proxy, useCapture);
		}
	} else if (
		name !== "list" &&
		name !== "tagName" && // HTMLButtonElement.form and HTMLInputElement.form are read-only but can be set using
		// setAttribute
		name !== "form" &&
		name !== "type" &&
		name !== "size" &&
		name !== "download" &&
		name !== "href" &&
		!isSvg &&
		name in dom
	) {
		dom[name] = value == null ? "" : value;
	} else if (typeof value != "function" && name !== "dangerouslySetInnerHTML") {
		if (name !== (name = name.replace(/xlink:?/, ""))) {
			if (value == null || value === false) {
				dom.removeAttributeNS(
					"http://www.w3.org/1999/xlink",
					name.toLowerCase()
				);
			} else {
				dom.setAttributeNS(
					"http://www.w3.org/1999/xlink",
					name.toLowerCase(),
					value
				);
			}
		} else if (
			value == null ||
			(value === false && // ARIA-attributes have a different notion of boolean values.
				// The value `false` is different from the attribute not
				// existing on the DOM, so we can't remove it. For non-boolean
				// ARIA-attributes we could treat false as a removal, but the
				// amount of exceptions would cost us too many bytes. On top of
				// that other VDOM frameworks also always stringify `false`.
				!/^ar/.test(name))
		) {
			dom.removeAttribute(name);
		} else {
			dom.setAttribute(name, value);
		}
	}
}
/**
 * Proxy an event to hooked event handlers
 * @param {Event} e The event object from the browser
 * @private
 */

function eventProxy(e) {
	this._listeners[e.type + false](options.event ? options.event(e) : e);
}

function eventProxyCapture(e) {
	this._listeners[e.type + true](options.event ? options.event(e) : e);
}

function reorderChildren(newVNode, oldDom, parentDom) {
	for (var tmp = 0; tmp < newVNode.__k.length; tmp++) {
		var vnode = newVNode.__k[tmp];

		if (vnode) {
			vnode.__ = newVNode;

			if (vnode.__e) {
				if (typeof vnode.type == "function" && vnode.__k.length > 1) {
					reorderChildren(vnode, oldDom, parentDom);
				}

				oldDom = placeChild(
					parentDom,
					vnode,
					vnode,
					newVNode.__k,
					null,
					vnode.__e,
					oldDom
				);

				if (typeof newVNode.type == "function") {
					newVNode.__d = oldDom;
				}
			}
		}
	}
}
/**
 * Diff two virtual nodes and apply proper changes to the DOM
 * @param {import('../internal').PreactElement} parentDom The parent of the DOM element
 * @param {import('../internal').VNode} newVNode The new virtual node
 * @param {import('../internal').VNode} oldVNode The old virtual node
 * @param {object} globalContext The current context object. Modified by getChildContext
 * @param {boolean} isSvg Whether or not this element is an SVG node
 * @param {Array<import('../internal').PreactElement>} excessDomChildren
 * @param {Array<import('../internal').Component>} commitQueue List of components
 * which have callbacks to invoke in commitRoot
 * @param {Element | Text} oldDom The current attached DOM
 * element any new dom elements should be placed around. Likely `null` on first
 * render (except when hydrating). Can be a sibling DOM element when diffing
 * Fragments that have siblings. In most cases, it starts out as `oldChildren[0]._dom`.
 * @param {boolean} [isHydrating] Whether or not we are in hydration
 */

function diff(
	parentDom,
	newVNode,
	oldVNode,
	globalContext,
	isSvg,
	excessDomChildren,
	commitQueue,
	oldDom,
	isHydrating
) {
	var tmp,
		newType = newVNode.type; // When passing through createElement it assigns the object
	// constructor as undefined. This to prevent JSON-injection.

	if (newVNode.constructor !== undefined) {
		return null;
	} // If the previous diff bailed out, resume creating/hydrating.

	if (oldVNode.__h != null) {
		isHydrating = oldVNode.__h;
		oldDom = newVNode.__e = oldVNode.__e; // if we resume, we want the tree to be "unlocked"

		newVNode.__h = null;
		excessDomChildren = [oldDom];
	}

	if ((tmp = options.__b)) {
		tmp(newVNode);
	}

	try {
		outer: if (typeof newType == "function") {
			var c, isNew, oldProps, oldState, snapshot, clearProcessingException;
			var newProps = newVNode.props; // Necessary for createContext api. Setting this property will pass
			// the context value as `this.context` just for this component.

			tmp = newType.contextType;
			var provider = tmp && globalContext[tmp.__c];
			var componentContext = tmp
				? provider
					? provider.props.value
					: tmp.__
				: globalContext; // Get component and set it to `c`

			if (oldVNode.__c) {
				c = newVNode.__c = oldVNode.__c;
				clearProcessingException = c.__ = c.__E;
			} else {
				// Instantiate the new component
				if ("prototype" in newType && newType.prototype.render) {
					newVNode.__c = c = new newType(newProps, componentContext); // eslint-disable-line new-cap
				} else {
					newVNode.__c = c = new Component(newProps, componentContext);
					c.constructor = newType;
					c.render = doRender;
				}

				if (provider) {
					provider.sub(c);
				}
				c.props = newProps;
				if (!c.state) {
					c.state = {};
				}
				c.context = componentContext;
				c.__n = globalContext;
				isNew = c.__d = true;
				c.__h = [];
			} // Invoke getDerivedStateFromProps

			if (c.__s == null) {
				c.__s = c.state;
			}

			if (newType.getDerivedStateFromProps != null) {
				if (c.__s == c.state) {
					c.__s = assign({}, c.__s);
				}

				assign(c.__s, newType.getDerivedStateFromProps(newProps, c.__s));
			}

			oldProps = c.props;
			oldState = c.state; // Invoke pre-render lifecycle methods

			if (isNew) {
				if (
					newType.getDerivedStateFromProps == null &&
					c.componentWillMount != null
				) {
					c.componentWillMount();
				}

				if (c.componentDidMount != null) {
					c.__h.push(c.componentDidMount);
				}
			} else {
				if (
					newType.getDerivedStateFromProps == null &&
					newProps !== oldProps &&
					c.componentWillReceiveProps != null
				) {
					c.componentWillReceiveProps(newProps, componentContext);
				}

				if (
					(!c.__e &&
						c.shouldComponentUpdate != null &&
						c.shouldComponentUpdate(newProps, c.__s, componentContext) ===
							false) ||
					newVNode.__v === oldVNode.__v
				) {
					c.props = newProps;
					c.state = c.__s; // More info about this here: https://gist.github.com/JoviDeCroock/bec5f2ce93544d2e6070ef8e0036e4e8

					if (newVNode.__v !== oldVNode.__v) {
						c.__d = false;
					}
					c.__v = newVNode;
					newVNode.__e = oldVNode.__e;
					newVNode.__k = oldVNode.__k;

					if (c.__h.length) {
						commitQueue.push(c);
					}

					reorderChildren(newVNode, oldDom, parentDom);
					break outer;
				}

				if (c.componentWillUpdate != null) {
					c.componentWillUpdate(newProps, c.__s, componentContext);
				}

				if (c.componentDidUpdate != null) {
					c.__h.push(function () {
						c.componentDidUpdate(oldProps, oldState, snapshot);
					});
				}
			}

			c.context = componentContext;
			c.props = newProps;
			c.state = c.__s;
			if ((tmp = options.__r)) {
				tmp(newVNode);
			}
			c.__d = false;
			c.__v = newVNode;
			c.__P = parentDom;
			tmp = c.render(c.props, c.state, c.context); // Handle setState called in render, see #2553

			c.state = c.__s;

			if (c.getChildContext != null) {
				globalContext = assign(assign({}, globalContext), c.getChildContext());
			}

			if (!isNew && c.getSnapshotBeforeUpdate != null) {
				snapshot = c.getSnapshotBeforeUpdate(oldProps, oldState);
			}

			var isTopLevelFragment =
				tmp != null && tmp.type == Fragment && tmp.key == null;
			var renderResult = isTopLevelFragment ? tmp.props.children : tmp;
			diffChildren(
				parentDom,
				Array.isArray(renderResult) ? renderResult : [renderResult],
				newVNode,
				oldVNode,
				globalContext,
				isSvg,
				excessDomChildren,
				commitQueue,
				oldDom,
				isHydrating
			);
			c.base = newVNode.__e; // We successfully rendered this VNode, unset any stored hydration/bailout state:

			newVNode.__h = null;

			if (c.__h.length) {
				commitQueue.push(c);
			}

			if (clearProcessingException) {
				c.__E = c.__ = null;
			}

			c.__e = false;
		} else if (excessDomChildren == null && newVNode.__v === oldVNode.__v) {
			newVNode.__k = oldVNode.__k;
			newVNode.__e = oldVNode.__e;
		} else {
			newVNode.__e = diffElementNodes(
				oldVNode.__e,
				newVNode,
				oldVNode,
				globalContext,
				isSvg,
				excessDomChildren,
				commitQueue,
				isHydrating
			);
		}

		if ((tmp = options.diffed)) {
			tmp(newVNode);
		}
	} catch (e) {
		newVNode.__v = null; // if hydrating or creating initial tree, bailout preserves DOM:

		if (isHydrating || excessDomChildren != null) {
			newVNode.__e = oldDom;
			newVNode.__h = !!isHydrating;
			excessDomChildren[excessDomChildren.indexOf(oldDom)] = null; // ^ could possibly be simplified to:
			// excessDomChildren.length = 0;
		}

		options.__e(e, newVNode, oldVNode);
	}

	return newVNode.__e;
}
/**
 * @param {Array<import('../internal').Component>} commitQueue List of components
 * which have callbacks to invoke in commitRoot
 * @param {import('../internal').VNode} root
 */

function commitRoot(commitQueue, root) {
	if (options.__c) {
		options.__c(root, commitQueue);
	}
	commitQueue.some(function (c) {
		try {
			commitQueue = c.__h;
			c.__h = [];
			commitQueue.some(function (cb) {
				cb.call(c);
			});
		} catch (e) {
			options.__e(e, c.__v);
		}
	});
}
/**
 * Diff two virtual nodes representing DOM element
 * @param {import('../internal').PreactElement} dom The DOM element representing
 * the virtual nodes being diffed
 * @param {import('../internal').VNode} newVNode The new virtual node
 * @param {import('../internal').VNode} oldVNode The old virtual node
 * @param {object} globalContext The current context object
 * @param {boolean} isSvg Whether or not this DOM node is an SVG node
 * @param {*} excessDomChildren
 * @param {Array<import('../internal').Component>} commitQueue List of components
 * which have callbacks to invoke in commitRoot
 * @param {boolean} isHydrating Whether or not we are in hydration
 * @returns {import('../internal').PreactElement}
 */

function diffElementNodes(
	dom,
	newVNode,
	oldVNode,
	globalContext,
	isSvg,
	excessDomChildren,
	commitQueue,
	isHydrating
) {
	var i;
	var oldProps = oldVNode.props;
	var newProps = newVNode.props; // Tracks entering and exiting SVG namespace when descending through the tree.

	isSvg = newVNode.type === "svg" || isSvg;

	if (excessDomChildren != null) {
		for (i = 0; i < excessDomChildren.length; i++) {
			var child = excessDomChildren[i]; // if newVNode matches an element in excessDomChildren or the `dom`
			// argument matches an element in excessDomChildren, remove it from
			// excessDomChildren so it isn't later removed in diffChildren

			if (
				child != null &&
				((newVNode.type === null
					? child.nodeType === 3
					: child.localName === newVNode.type) ||
					dom == child)
			) {
				dom = child;
				excessDomChildren[i] = null;
				break;
			}
		}
	}

	if (dom == null) {
		if (newVNode.type === null) {
			return document.createTextNode(newProps);
		}

		dom = isSvg
			? document.createElementNS("http://www.w3.org/2000/svg", newVNode.type)
			: document.createElement(
					newVNode.type,
					newProps.is && {
						is: newProps.is,
					}
			  ); // we created a new parent, so none of the previously attached children can be reused:

		excessDomChildren = null; // we are creating a new node, so we can assume this is a new subtree (in case we are hydrating), this deopts the hydrate

		isHydrating = false;
	}

	if (newVNode.type === null) {
		// During hydration, we still have to split merged text from SSR'd HTML.
		if (oldProps !== newProps && (!isHydrating || dom.data !== newProps)) {
			dom.data = newProps;
		}
	} else {
		if (excessDomChildren != null) {
			excessDomChildren = EMPTY_ARR.slice.call(dom.childNodes);
		}

		oldProps = oldVNode.props || EMPTY_OBJ;
		var oldHtml = oldProps.dangerouslySetInnerHTML;
		var newHtml = newProps.dangerouslySetInnerHTML; // During hydration, props are not diffed at all (including dangerouslySetInnerHTML)
		// @TODO we should warn in debug mode when props don't match here.

		if (!isHydrating) {
			// But, if we are in a situation where we are using existing DOM (e.g. replaceNode)
			// we should read the existing DOM attributes to diff them
			if (excessDomChildren != null) {
				oldProps = {};

				for (var _i = 0; _i < dom.attributes.length; _i++) {
					oldProps[dom.attributes[_i].name] = dom.attributes[_i].value;
				}
			}

			if (newHtml || oldHtml) {
				// Avoid re-applying the same '__html' if it did not changed between re-render
				if (
					!newHtml ||
					((!oldHtml || newHtml.__html != oldHtml.__html) &&
						newHtml.__html !== dom.innerHTML)
				) {
					dom.innerHTML = (newHtml && newHtml.__html) || "";
				}
			}
		}

		diffProps(dom, newProps, oldProps, isSvg, isHydrating); // If the new vnode didn't have dangerouslySetInnerHTML, diff its children

		if (newHtml) {
			newVNode.__k = [];
		} else {
			i = newVNode.props.children;
			diffChildren(
				dom,
				Array.isArray(i) ? i : [i],
				newVNode,
				oldVNode,
				globalContext,
				newVNode.type === "foreignObject" ? false : isSvg,
				excessDomChildren,
				commitQueue,
				EMPTY_OBJ,
				isHydrating
			);
		} // (as above, don't diff props during hydration)

		if (!isHydrating) {
			if (
				"value" in newProps &&
				(i = newProps.value) !== undefined && // #2756 For the <progress>-element the initial value is 0,
				// despite the attribute not being present. When the attribute
				// is missing the progress bar is treated as indeterminate.
				// To fix that we'll always update it when it is 0 for progress elements
				(i !== dom.value || (newVNode.type === "progress" && !i))
			) {
				setProperty(dom, "value", i, oldProps.value, false);
			}

			if (
				"checked" in newProps &&
				(i = newProps.checked) !== undefined &&
				i !== dom.checked
			) {
				setProperty(dom, "checked", i, oldProps.checked, false);
			}
		}
	}

	return dom;
}
/**
 * Invoke or update a ref, depending on whether it is a function or object ref.
 * @param {object|function} ref
 * @param {any} value
 * @param {import('../internal').VNode} vnode
 */

function applyRef(ref, value, vnode) {
	try {
		if (typeof ref == "function") {
			ref(value);
		} else {
			ref.current = value;
		}
	} catch (e) {
		options.__e(e, vnode);
	}
}
/**
 * Unmount a virtual node from the tree and apply DOM changes
 * @param {import('../internal').VNode} vnode The virtual node to unmount
 * @param {import('../internal').VNode} parentVNode The parent of the VNode that
 * initiated the unmount
 * @param {boolean} [skipRemove] Flag that indicates that a parent node of the
 * current element is already detached from the DOM.
 */

function unmount(vnode, parentVNode, skipRemove) {
	var r;
	if (options.unmount) {
		options.unmount(vnode);
	}

	if ((r = vnode.ref)) {
		if (!r.current || r.current === vnode.__e) {
			applyRef(r, null, parentVNode);
		}
	}

	var dom;

	if (!skipRemove && typeof vnode.type != "function") {
		skipRemove = (dom = vnode.__e) != null;
	} // Must be set to `undefined` to properly clean up `_nextDom`
	// for which `null` is a valid value. See comment in `create-element.js`

	vnode.__e = vnode.__d = undefined;

	if ((r = vnode.__c) != null) {
		if (r.componentWillUnmount) {
			try {
				r.componentWillUnmount();
			} catch (e) {
				options.__e(e, parentVNode);
			}
		}

		r.base = r.__P = null;
	}

	if ((r = vnode.__k)) {
		for (var i = 0; i < r.length; i++) {
			if (r[i]) {
				unmount(r[i], parentVNode, skipRemove);
			}
		}
	}

	if (dom != null) {
		removeNode(dom);
	}
}
/** The `.render()` method for a PFC backing instance. */

function doRender(props, state, context) {
	return this.constructor(props, context);
}

var IS_HYDRATE = EMPTY_OBJ;
/**
 * Render a Preact virtual node into a DOM element
 * @param {import('./index').ComponentChild} vnode The virtual node to render
 * @param {import('./internal').PreactElement} parentDom The DOM element to
 * render into
 * @param {Element | Text} [replaceNode] Optional: Attempt to re-use an
 * existing DOM tree rooted at `replaceNode`
 */

function render(vnode, parentDom, replaceNode) {
	if (options.__) {
		options.__(vnode, parentDom);
	} // We abuse the `replaceNode` parameter in `hydrate()` to signal if we
	// are in hydration mode or not by passing `IS_HYDRATE` instead of a
	// DOM element.

	var isHydrating = replaceNode === IS_HYDRATE; // To be able to support calling `render()` multiple times on the same
	// DOM node, we need to obtain a reference to the previous tree. We do
	// this by assigning a new `_children` property to DOM nodes which points
	// to the last rendered tree. By default this property is not present, which
	// means that we are mounting a new tree for the first time.

	var oldVNode = isHydrating
		? null
		: (replaceNode && replaceNode.__k) || parentDom.__k;
	vnode = createElement(Fragment, null, [vnode]); // List of effects that need to be called after diffing.

	var commitQueue = [];
	diff(
		parentDom, // Determine the new vnode tree and store it on the DOM element on
		// our custom `_children` property.
		((isHydrating ? parentDom : replaceNode || parentDom).__k = vnode),
		oldVNode || EMPTY_OBJ,
		EMPTY_OBJ,
		parentDom.ownerSVGElement !== undefined,
		replaceNode && !isHydrating
			? [replaceNode]
			: oldVNode
			? null
			: parentDom.childNodes.length
			? EMPTY_ARR.slice.call(parentDom.childNodes)
			: null,
		commitQueue,
		replaceNode || EMPTY_OBJ,
		isHydrating
	); // Flush all queued effects

	commitRoot(commitQueue, vnode);
}
/**
 * Update an existing DOM element with data from a Preact virtual node
 * @param {import('./index').ComponentChild} vnode The virtual node to render
 * @param {import('./internal').PreactElement} parentDom The DOM element to
 * update
 */

function hydrate(vnode, parentDom) {
	render(vnode, parentDom, IS_HYDRATE);
}

/**
 * Clones the given VNode, optionally adding attributes/props and replacing its children.
 * @param {import('./internal').VNode} vnode The virtual DOM element to clone
 * @param {object} props Attributes/props to add when cloning
 * @param {Array<import('./index').ComponentChildren>} rest Any additional arguments will be used as replacement children.
 * @returns {import('./internal').VNode}
 */

function cloneElement(vnode, props, children) {
	var arguments$1 = arguments;

	var normalizedProps = assign({}, vnode.props),
		key,
		ref,
		i;

	for (i in props) {
		if (i == "key") {
			key = props[i];
		} else if (i == "ref") {
			ref = props[i];
		} else {
			normalizedProps[i] = props[i];
		}
	}

	if (arguments.length > 3) {
		children = [children];

		for (i = 3; i < arguments.length; i++) {
			children.push(arguments$1[i]);
		}
	}

	if (children != null) {
		normalizedProps.children = children;
	}

	return createVNode(
		vnode.type,
		normalizedProps,
		key || vnode.key,
		ref || vnode.ref,
		null
	);
}

var i = 0;
function createContext(defaultValue, contextId) {
	contextId = "__cC" + i++;
	var context = {
		__c: contextId,
		__: defaultValue,
		Consumer: function Consumer(props, contextValue) {
			// return props.children(
			// 	context[contextId] ? context[contextId].props.value : defaultValue
			// );
			return props.children(contextValue);
		},
		Provider: function Provider(props, subs, ctx) {
			if (!this.getChildContext) {
				subs = [];
				ctx = {};
				ctx[contextId] = this;

				this.getChildContext = function () {
					return ctx;
				};

				this.shouldComponentUpdate = function (_props) {
					if (this.props.value !== _props.value) {
						// I think the forced value propagation here was only needed when `options.debounceRendering` was being bypassed:
						// https://github.com/preactjs/preact/commit/4d339fb803bea09e9f198abf38ca1bf8ea4b7771#diff-54682ce380935a717e41b8bfc54737f6R358
						// In those cases though, even with the value corrected, we're double-rendering all nodes.
						// It might be better to just tell folks not to use force-sync mode.
						// Currently, using `useContext()` in a class component will overwrite its `this.context` value.
						// subs.some(c => {
						// 	c.context = _props.value;
						// 	enqueueRender(c);
						// });
						// subs.some(c => {
						// 	c.context[contextId] = _props.value;
						// 	enqueueRender(c);
						// });
						subs.some(enqueueRender);
					}
				};

				this.sub = function (c) {
					subs.push(c);
					var old = c.componentWillUnmount;

					c.componentWillUnmount = function () {
						subs.splice(subs.indexOf(c), 1);
						if (old) {
							old.call(c);
						}
					};
				};
			}

			return props.children;
		},
	}; // Devtools needs access to the context object when it
	// encounters a Provider. This is necessary to support
	// setting `displayName` on the context object instead
	// of on the component itself. See:
	// https://reactjs.org/docs/context.html#contextdisplayname

	return (context.Provider.__ = context.Consumer.contextType = context);
}

// export {
// 	render,
// 	hydrate,
// 	createElement,
// 	createElement as h,
// 	Fragment,
// 	createRef,
// 	isValidElement,
// 	Component,
// 	cloneElement,
// 	createContext,
// 	toChildArray,
// 	unmount as __u,
// 	options,
// };
//# sourceMappingURL=preact.module.js.map
