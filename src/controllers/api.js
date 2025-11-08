import Content from "../models/Content.js";
import User from "../models/User.js";

// Catalog endpoints (minimal placeholders to avoid import errors)
export const catalogList = async (req, res) => {
	try {
		const items = await Content.find({}).limit(100).lean();
		res.json(items);
	} catch (e) {
		console.error("catalogList failed", e);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const genreList = async (req, res) => {
	try {
		const genre = req.params.genre;
		const items = await Content.find({ genres: genre }).limit(100).lean();
		res.json(items);
	} catch (e) {
		console.error("genreList failed", e);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const popular = async (req, res) => {
	try {
		const items = await Content.find({}).sort({ popularity: -1 }).limit(50).lean();
		res.json(items);
	} catch (e) {
		console.error("popular failed", e);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const newestByGenre = async (req, res) => {
	try {
		const items = await Content.find({}).sort({ createdAt: -1 }).limit(50).lean();
		res.json(items);
	} catch (e) {
		console.error("newestByGenre failed", e);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const profilesHistory = async (_req, res) => res.json([]);
export const profilesRecommendations = async (_req, res) => res.json([]);

// Core: get content details as JSON for player/show pages
export const contentDetails = async (req, res) => {
	try {
		const { id } = req.params;
		const content = await Content.findById(id).lean();
		if (!content) return res.status(404).json({ error: "Content not found" });

		// compute likedByUser
		let likedByUser = false;
		if (req.session?.user && req.session?.profile) {
			const user = await User.findById(req.session.user.id).lean();
			const prof = user?.profiles?.find?.((p) => String(p._id) === req.session.profile);
			const liked = prof?.liked?.map?.((x) => String(x)) || [];
			likedByUser = liked.includes(String(id));
		}

		res.json({ ...content, likedByUser });
	} catch (e) {
		console.error("contentDetails failed", e);
		res.status(500).json({ error: "Internal server error" });
	}
};

