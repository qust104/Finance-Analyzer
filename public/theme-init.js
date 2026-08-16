(function () {
  try {
    var theme = localStorage.getItem('finance-analyzer.theme')
    if (theme !== 'light' && theme !== 'dark') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    document.documentElement.dataset.theme = theme
  } catch (e) {
    document.documentElement.dataset.theme = 'light'
  }
})()