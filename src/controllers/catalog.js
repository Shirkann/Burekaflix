export const home = (req, res) => {
  return res.render("catalog/index", {
    pageTitle: "Catalog - BurekaFlix",
    initialGenre: req.query.genre || "",
  });
};

export const byGenre = (req, res) => {
  return res.render("catalog/index", {
    pageTitle: `ז׳אנר: ${req.params.genre}`,
    initialGenre: req.params.genre,
  });
};
