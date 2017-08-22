import '../polymer/polymer.js';
import { IronResizableBehavior } from '../iron-resizable-behavior/iron-resizable-behavior.js';
import { Polymer as Polymer$0 } from '../polymer/lib/legacy/polymer-fn.js';
import { dom } from '../polymer/lib/legacy/polymer.dom.js';

export const PaperScrollHeaderPanel = Polymer$0({
  _template: `
    <style>
      :host {
        display: block;
        position: relative;
        overflow: hidden;
      }

      #mainContainer {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        -moz-box-sizing: border-box;
        box-sizing: border-box;
        -webkit-overflow-scrolling: touch;
        overflow-x: hidden;
        overflow-y: auto;
        @apply --paper-scroll-header-container; /* deprecated due to incorrect/confusing naming */
        @apply --paper-scroll-header-panel-container;
      }

      #headerContainer {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        @apply --paper-scroll-header-panel-header-container;
      }

      .bg-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      #headerBg {
        @apply --paper-scroll-header-panel-full-header;
      }

      #condensedHeaderBg {
        @apply --paper-scroll-header-panel-condensed-header;
      }

      #headerBg, #condensedHeaderBg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center center;
      }

      #condensedHeaderBg {
        opacity: 0;
      }
    </style>

    <div id="mainContainer">
      <slot id="mainSlot" name="content"></slot>
    </div>
    <div id="headerContainer">
      <div class="bg-container">
        <div id="condensedHeaderBg"></div>
        <div id="headerBg"></div>
      </div>
      <slot id="headerSlot" name="header"></slot>
    </div>
`,

  /**
   * Fired when the content has been scrolled.
   *
   * @event content-scroll
   */

  /**
   * Fired when the header is transformed.
   *
   * @event paper-header-transform
   */

  is: 'paper-scroll-header-panel',

  behaviors: [
    IronResizableBehavior
  ],

  properties: {

    /**
     * If true, the header's height will condense to `condensedHeaderHeight`
     * as the user scrolls down from the top of the content area.
     */
    condenses: {
      type: Boolean,
      value: false
    },

    /**
     * If true, no cross-fade transition from one background to another.
     */
    noDissolve: {
      type: Boolean,
      value: false
    },

    /**
     * If true, the header doesn't slide back in when scrolling back up.
     */
    noReveal: {
      type: Boolean,
      value: false
    },

    /**
     * If true, the header is fixed to the top and never moves away.
     */
    fixed: {
      type: Boolean,
      value: false
    },

    /**
     * If true, the condensed header is always shown and does not move away.
     */
    keepCondensedHeader: {
      type: Boolean,
      value: false
    },

    /**
     * The height of the header when it is at its full size.
     *
     * By default, the height will be measured when it is ready.  If the height
     * changes later the user needs to either set this value to reflect the
     * new height or invoke `measureHeaderHeight()`.
     */
    headerHeight: {
      type: Number
    },

    /**
     * The height of the header when it is condensed.
     *
     * By default, `condensedHeaderHeight` is 1/3 of `headerHeight` unless
     * this is specified.
     */
    condensedHeaderHeight: {
      type: Number,
      value: 0
    },

    /**
     * By default, the top part of the header stays when the header is being
     * condensed.  Set this to true if you want the top part of the header
     * to be scrolled away.
     */
    scrollAwayTopbar: {
      type: Boolean,
      value: false
    },

    /**
     * The state of the header. Depending on the configuration and the `scrollTop` value,
     * the header state could change to
     *      Polymer.PaperScrollHeaderPanel.HEADER_STATE_EXPANDED
     *      Polymer.PaperScrollHeaderPanel.HEADER_STATE_HIDDEN
     *      Polymer.PaperScrollHeaderPanel.HEADER_STATE_CONDENSED
     *      Polymer.PaperScrollHeaderPanel.HEADER_STATE_INTERPOLATED
     */
    headerState: {
      type: Number,
      readOnly: true,
      notify:true,
      value: 0
    },

    /** @type {number|null} */
    _defaultCondsensedHeaderHeight: {
      type: Number,
      value: 0
    }
  },

  observers: [
    '_setup(headerHeight, condensedHeaderHeight, fixed)',
    '_condensedHeaderHeightChanged(condensedHeaderHeight)',
    '_headerHeightChanged(headerHeight, condensedHeaderHeight)',
    '_condensesChanged(condenses, headerHeight)',
  ],

  listeners: {
    'iron-resize': 'measureHeaderHeight'
  },

  ready: function() {
    this._scrollHandler = this._scroll.bind(this);
    this.scroller.addEventListener('scroll', this._scrollHandler);
    console.warn(this.is, 'is deprecated. Please use app-layout instead!');
  },

  attached: function() {
    requestAnimationFrame(this.measureHeaderHeight.bind(this));
  },

  /**
   * Returns the header element.
   *
   * @property header
   * @type Object
   */
  get header() {
    return dom(this.$.headerSlot).getDistributedNodes()[0];
  },

  /**
   * Returns the content element.
   *
   * @property content
   * @type Object
   */
  get content() {
    return dom(this.$.mainSlot).getDistributedNodes()[0];
  },

  /**
   * Returns the scrollable element.
   *
   * @property scroller
   * @type Object
   */
  get scroller() {
    return this.$.mainContainer;
  },

  get _headerMaxDelta() {
    return this.keepCondensedHeader ? this._headerMargin : this.headerHeight;
  },

  get _headerMargin() {
    return this.headerHeight - this.condensedHeaderHeight;
  },

  _y: 0,
  _prevScrollTop: 0,

  /**
   * Invoke this to tell `paper-scroll-header-panel` to re-measure the header's
   * height.
   *
   * @method measureHeaderHeight
   */
  measureHeaderHeight: function() {
    var header = this.header;
    if (header && header.offsetHeight) {
      this.headerHeight = header.offsetHeight;
    }
  },

  /**
   * Scroll to a specific y coordinate.
   *
   * @method scroll
   * @param {number} top The coordinate to scroll to, along the y-axis.
   * @param {boolean} smooth true if the scroll position should be smoothly adjusted.
   */
  scroll: function(top, smooth) {
    // the scroll event will trigger _updateScrollState directly,
    // However, _updateScrollState relies on the previous `scrollTop` to update the states.
    // Calling _updateScrollState will ensure that the states are synced correctly.

    if (smooth) {
      // TODO(blasten): use CSS scroll-behavior once it ships in Chrome.
      var easingFn = function easeOutQuad(t, b, c, d) {
        t /= d;
        return -c * t*(t-2) + b;
      };
      var animationId = Math.random();
      var duration = 200;
      var startTime = Date.now();
      var currentScrollTop = this.scroller.scrollTop;
      var deltaScrollTop = top - currentScrollTop;

      this._currentAnimationId = animationId;

      (function updateFrame() {
        var now = Date.now();
        var elapsedTime = now - startTime;

        if (elapsedTime > duration) {
          this.scroller.scrollTop = top;
          this._updateScrollState(top);

        } else if (this._currentAnimationId === animationId) {
          this.scroller.scrollTop = easingFn(elapsedTime, currentScrollTop, deltaScrollTop, duration);
          requestAnimationFrame(updateFrame.bind(this));
        }

      }).call(this);

    } else {
      this.scroller.scrollTop = top;
      this._updateScrollState(top);
    }
  },

  /**
    * Condense the header.
    *
    * @method condense
    * @param {boolean} smooth true if the scroll position should be smoothly adjusted.
    */
  condense: function(smooth) {
    if (this.condenses && !this.fixed && !this.noReveal) {
      switch (this.headerState) {
        case 1:
          this.scroll(this.scroller.scrollTop - (this._headerMaxDelta - this._headerMargin), smooth);
        break;
        case 0:
        case 3:
          this.scroll(this._headerMargin, smooth);
        break;
      }
    }
  },

  /**
   * Scroll to the top of the content.
   *
   * @method scrollToTop
   * @param {boolean} smooth true if the scroll position should be smoothly adjusted.
   */
  scrollToTop: function(smooth) {
    this.scroll(0, smooth);
  },

  _headerHeightChanged: function(headerHeight) {
    if (this._defaultCondsensedHeaderHeight !== null) {
      this._defaultCondsensedHeaderHeight = Math.round(headerHeight * 1/3);
      this.condensedHeaderHeight = this._defaultCondsensedHeaderHeight;
    }
  },

  _condensedHeaderHeightChanged: function(condensedHeaderHeight) {
    if (condensedHeaderHeight) {
      // a user custom value
      if (this._defaultCondsensedHeaderHeight != condensedHeaderHeight) {
        // disable the default value
        this._defaultCondsensedHeaderHeight = null;
      }
    }
  },

  _condensesChanged: function() {
    this._updateScrollState(this.scroller.scrollTop);
    this._condenseHeader(null);
  },

  _setup: function() {
    var s = this.scroller.style;

    s.paddingTop = this.fixed ? '' : this.headerHeight + 'px';
    s.top = this.fixed ? this.headerHeight + 'px' : '';

    if (this.fixed) {
      this._setHeaderState(0);
      this._transformHeader(null);
    } else {
      switch (this.headerState) {
        case 1:
          this._transformHeader(this._headerMaxDelta);
        break;
        case 2:
          this._transformHeader(this._headerMargin);
        break;
      }
    }
  },

  _transformHeader: function(y) {
    this._translateY(this.$.headerContainer, -y);

    if (this.condenses) {
      this._condenseHeader(y);
    }

    this.fire('paper-header-transform',
      { y: y,
        height: this.headerHeight,
        condensedHeight: this.condensedHeaderHeight
      }
    );
  },

  _condenseHeader: function(y) {
    var reset = (y === null);

    // adjust top bar in paper-header so the top bar stays at the top
    if (!this.scrollAwayTopbar && this.header && this.header.$ && this.header.$.topBar) {
      this._translateY(this.header.$.topBar,
          reset ? null : Math.min(y, this._headerMargin));
    }
    // transition header bg
    if (!this.noDissolve) {
      this.$.headerBg.style.opacity = reset ? '' :
          ( (this._headerMargin - y) / this._headerMargin);
    }
    // adjust header bg so it stays at the center
    this._translateY(this.$.headerBg, reset ? null : y / 2);
    // transition condensed header bg
    if (!this.noDissolve) {
      this.$.condensedHeaderBg.style.opacity = reset ? '' :
          (y / this._headerMargin);

      // adjust condensed header bg so it stays at the center
      this._translateY(this.$.condensedHeaderBg, reset ? null : y / 2);
    }
  },

  _translateY: function(node, y) {
    this.transform((y === null) ? '' : 'translate3d(0, ' + y + 'px, 0)', node);
  },

  /** @param {Event=} event */
  _scroll: function(event) {
    if (this.header) {
      this._updateScrollState(this.scroller.scrollTop);

      this.fire('content-scroll', {
        target: this.scroller
      },
      {
        cancelable: false
      });
    }
  },

  _updateScrollState: function(scrollTop) {
    var deltaScrollTop = scrollTop - this._prevScrollTop;
    var y = Math.max(0, (this.noReveal) ? scrollTop : this._y + deltaScrollTop);

    if (y > this._headerMaxDelta) {
      y = this._headerMaxDelta;

      if (this.keepCondensedHeader) {
        this._setHeaderState(2);
      } else {
        this._setHeaderState(1);
      }
    } else if (this.condenses && scrollTop >= this._headerMargin) {
      y = Math.max(y, this._headerMargin);
      this._setHeaderState(2);

    } else if (y === 0) {
      this._setHeaderState(0);

    } else {
      this._setHeaderState(3);
    }

    if (!this.fixed && y !== this._y) {
      this._transformHeader(y);
    }

    this._prevScrollTop = Math.max(scrollTop, 0);
    this._y = y;
  }
});

PaperScrollHeaderPanel.HEADER_STATE_EXPANDED = 0;
PaperScrollHeaderPanel.HEADER_STATE_HIDDEN = 1;
PaperScrollHeaderPanel.HEADER_STATE_CONDENSED = 2;
PaperScrollHeaderPanel.HEADER_STATE_INTERPOLATED = 3;
