import { WaterMarkConfig } from '../types'

/**
 * @description 监控水印的dom元素，防止被改变
 * @param watermark 水印dom元素
 * @param config 水印配置
 * @returns 监视器observe，配有remove方法，可以删除水印
 */

// @ts-ignore
const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver

export const observeWatermark = (
  watermark: HTMLDivElement,
  config: WaterMarkConfig
) => {
  const { onchange, success } = config
  const observe = new Guard(watermark, onchange)
  success()
  return observe
}

export class Guard {
  parentElement: HTMLElement
  observer!: MutationObserver
  private elementClone: HTMLElement
  private setIntervalId: number | undefined

  constructor(public element: HTMLElement, public onchange: Function) {
    // 获取watermark的父元素：监视的对象
    this.parentElement = this.element.parentElement as HTMLElement
    // 克隆一个watermark：当watermark被删除时添加watermarkClone
    this.elementClone = element.cloneNode(true) as HTMLElement
  }

  start() {
    const config = {
      characterData: true,
      attributes: true,
      childList: true,
      subtree: true
    }
    if (MutationObserver) {
      this.observer = new MutationObserver(this._callback)
      this.observer.observe(this.parentElement, config)
    } else {
      this.setIntervalId = window.setInterval(() => {
        const newWatermark = this.elementClone.cloneNode(true) as HTMLElement
        this.parentElement.replaceChild(newWatermark, this.element)
        this.element = newWatermark
      }, 200)
    }
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect()
    } else if (this.setIntervalId) {
      window.clearInterval(this.setIntervalId)
    }
    this.element.remove()
  }


  private _callback = (mutationsList: MutationRecord[]) => {
    let needRestart = false
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        for (let i = 0; i < mutation.removedNodes.length; i++) {
          if (mutation.removedNodes[i] === this.element) {
            needRestart = true
            break
          }
        }
      } else if (mutation.target === this.element) {
        needRestart = true
      }
      if (needRestart) {
        this.onchange(mutation)
        this._reAddWatermark()
        this.start()
        break
      }
    }
  }

  // 重新添加水印dom
  private _reAddWatermark() {
    const newWatermark = this.elementClone.cloneNode(true) as HTMLElement
    this.parentElement.appendChild(newWatermark)
    this.element = newWatermark
    if (this.observer) {
      this.observer.disconnect()
    }
    this.start()
  }
}
