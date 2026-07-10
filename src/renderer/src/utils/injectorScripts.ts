export const CHECK_ACTIVE_ELEMENT_IS_INPUT = `
(function() {
  return new Promise(function(resolve) {
    requestAnimationFrame(function() {
      var el = document.activeElement;
      resolve(!!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable));
    });
  });
})()
`

export const FOCUS_TRACKER = `
(function() {
  if (window.__kbt) return;
  window.__kbt = true;
  function report() {
    var el = document.activeElement;
    console.log('__KB__:' + !!(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)));
  }
  document.addEventListener('focusin', report);
  report();
})()
`
