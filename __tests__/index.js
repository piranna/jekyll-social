const jekyllSocial = require("..");

test("smoke", function () {
  expect(jekyllSocial).toMatchInlineSnapshot(`[Function]`);
});

test("no arguments", function () {
  function func() {
    jekyllSocial();
  }

  expect(func).toThrowErrorMatchingInlineSnapshot(
    `"Cannot destructure property 'app_installation_token' of 'undefined' as it is undefined."`
  );
});

test("empty options", function () {
  const result = jekyllSocial({});

  return expect(result).rejects.toThrowErrorMatchingInlineSnapshot(`
            "Server responded to https://api.github.com/repos/undefined/undefined/pages with status code 404:
            {\\"message\\":\\"Not Found\\",\\"documentation_url\\":\\"https://docs.github.com/rest/reference/repos#get-a-github-pages-site\\"}"
          `);
});
