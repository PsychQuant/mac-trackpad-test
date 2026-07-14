describe('sanity', () => {
  it('jsdom 環境可用', () => {
    const el = document.createElement('div');
    el.textContent = 'ok';
    expect(el.textContent).toBe('ok');
  });
});
