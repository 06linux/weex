import { validateStyles } from '../validator'
import { debounce, bind, createMixin } from '../utils'
import * as rectMethods from '../methods/rect'

export default {
  mixins: [createMixin(rectMethods)],
  props: {
    scrollDirection: {
      type: [String],
      default: 'vertical',
      validator (value) {
        return ['horizontal', 'vertical'].indexOf(value) !== -1
      }
    },
    loadmoreoffset: {
      type: [String, Number],
      default: 0
    }
  },

  computed: {
    wrapperClass () {
      const classArray = ['weex-scroller', 'weex-scroller-wrapper']
      if (this.scrollDirection === 'horizontal') {
        classArray.push('weex-scroller-horizontal')
      }
      return classArray.join(' ')
    }
  },

  methods: {
    updateLayout () {
      this.computeWrapperSize()
      if (this._cells && this._cells.length) {
        this._cells.forEach(vnode => {
          vnode._visible = this.isCellVisible(vnode.elm)
        })
      }
    },
    isCellVisible (elem) {
      if (!this.wrapperHeight) {
        this.computeWrapperSize()
      }
      const wrapper = this.$refs.wrapper
      return wrapper.scrollTop <= elem.offsetTop
        && elem.offsetTop < wrapper.scrollTop + this.wrapperHeight
    },
    handleScroll (event) {
      this._cells.forEach((vnode, index) => {
        const visible = this.isCellVisible(vnode.elm)
        if (visible !== vnode._visible) {
          const type = visible ? 'appear' : 'disappear'
          vnode._visible = visible

          // TODO: dispatch CustomEvent
          vnode.elm.dispatchEvent(new Event(type), {})
        }
      })
      if (this.reachBottom()) {
        this.$emit('loadmore', event)
      }
    }
  },

  render (createElement) {
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'development') {
      validateStyles('scroller', this.$vnode.data && this.$vnode.data.staticStyle)
    }

    this._cells = this.$slots.default || []
    this.$nextTick(() => {
      this.updateLayout()
    })

    return createElement('main', {
      ref: 'wrapper',
      attrs: { 'weex-type': 'scroller' },
      staticClass: this.wrapperClass,
      on: {
        scroll: debounce(bind(this.handleScroll, this), 100)
      }
    }, [
      createElement('mark', { ref: 'topMark', staticClass: 'weex-scroller-top-mark' }),
      createElement('div', {
        ref: 'inner',
        staticClass: 'weex-scroller-inner'
      }, this._cells),
      createElement('mark', { ref: 'bottomMark', staticClass: 'weex-scroller-bottom-mark' })
    ])
  }
}
