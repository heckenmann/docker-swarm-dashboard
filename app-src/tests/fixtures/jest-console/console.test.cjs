test('console policy probe', () => {
  const method = process.env.CONSOLE_PROBE_METHOD
  if (process.env.CONSOLE_PROBE_EXPECTED === 'true') {
    const spy = jest.spyOn(console, method).mockImplementation()
    try {
      console[method]('expected diagnostic')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith('expected diagnostic')
    } finally {
      spy.mockRestore()
    }
  } else {
    console[method]('unexpected diagnostic')
  }
})
