export const home = (req, res) => {
  return res.render("catalogBrowse", {
    pageTitle: "Catalog - BurekaFlix",
    initialGenre: req.query.genre || "",
  });
};

export const byGenre = (req, res) => {
  return res.render("catalogBrowse", {
    pageTitle: `ז׳אנר: ${req.params.genre}`,
    initialGenre: req.params.genre,
  });
};
