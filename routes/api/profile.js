const express = require("express");
const router = express.Router();
const Profile = require("../../models/Profile");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const normalize = require("normalize-url");
const axios = require("axios");
const config = require("config");

router.get("/me", auth, async (req, res) => {
  //get the profile for the authenticated user
  const user = req.user;
  const profile = await Profile.findOne({ user: req.user.id }).populate(
    "user",
    "name gravatar"
  );
  console.log(req.user);
  if (!profile) {
    return res.status(500).json({ msg: "Profile not found" });
  }

  res.send(profile);
});

// Save or Update the Profile

router.post("/", auth, [], async (req, res) => {
  //get all the fields from the request and set them in the profile object
  const {
    website,
    skills,
    youtube,
    twitter,
    instagram,
    linkedin,
    facebook,
    // spread the rest of the fields we don't need to check
    ...rest
  } = req.body;

  const profileFields = {
    user: req.user.id,
    website:
      website && website !== "" ? normalize(website, { forceHttps: true }) : "",
    skills: Array.isArray(skills)
      ? skills
      : skills.split(",").map((skill) => " " + skill.trim()),
    ...rest,
  };

  // Build socialFields object
  const socialFields = { youtube, twitter, instagram, linkedin, facebook };

  for ([key, val] of Object.entries(socialFields)) {
    socialFields[key] =
      val && val !== "" ? normalize(val, { forceHttps: true }) : " ";
  }
  profileFields.social = socialFields;

  try {
    let profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    console.log(profile);
    return res.json(profile);
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ msg: "Server Error" });
    s;
  }
});

router.get("/", async (req, res) => {
  try {
    let profiles = [];
    profiles = await Profile.find().populate("user", ["name", "avatar"]);
    if (!profiles)
      return res.status(400).json({ msg: "No profile currently availabe" });
    return res.json(profiles);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server Error" });
  }
});

router.get("/:user_id", auth, async (req, res) => {
  try {
    let userProfile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);
    if (!userProfile) return res.status(500).json({ msg: "Not found" });
    return res.json(userProfile);
  } catch (err) {
    console.log(err.msg);
    return res.status(500).json({ msg: "Server Error" });
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    await Promise.all([
      Profile.findOneAndRemove({ user: req.user.id }),
      User.findOneAndRemove({ id: req.user.id }),
    ]);
    res.json({ msg: "user deleted" });
  } catch (err) {
    console.log(err.msg);
    return res.status(500).json({ msg: "error" });
  }
});

router.put(
  "/experience",
  [
    check("title", "Job title is required").not().isEmpty(),
    check("company", "Company name is required").not().isEmpty(),
    check("from", "From date is required and needs to be from the past")
      .not()
      .isEmpty()
      .custom((value, { req }) => (req.body.to ? req.body.to > value : true)),
  ],
  auth,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      let profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(req.body);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err);
      res.status(500).json({ msg: err.msg });
    }
  }
);

router.delete("/experience/:expId", auth, async (req, res) => {
  // delete the user's added experience
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.experience = profile.experience.filter(
      (item) => item.id.toString() !== req.params.expId
    );
    await profile.save();
    return res.json({ profile });
  } catch (err) {
    console.log(err.msg);
    return res.status(500).json({ msg: "Server Error" });
  }
});

// Education

router.patch(
  "/education",
  auth,
  [
    check("school", "School is required").notEmpty(),
    check("degree", "Degree is required").notEmpty(),
    check("fieldofstudy", "Field of study is required").notEmpty(),
    check("from", "From date is required and needs to be from the past")
      .notEmpty()
      .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
  ],
  async (req, res) => {
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(req.body);
      await profile.save();
      return res.json({ profile });
    } catch (err) {
      console.log(err);
      return res.json({ msg: err.msg });
    }
  }
);

router.delete("/education/:edu_id", auth, async (req, res) => {
  // delete the user's added education
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.education = profile.education.filter(
      (item) => item.id.toString() !== req.params.edu_id
    );
    await profile.save();
    return res.json({ profile });
  } catch (err) {
    console.log(err.msg);
    return res.status(500).json({ msg: "Server Error" });
  }
});

//  get github credentials of users

router.get("/github/:username", async (req, res) => {
  try {
    const uri = encodeURI(
      `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
    );
    const headers = {
      "user-agent": "node.js",
      Authorization: `token ${config.get("githubToken")}`,
    };
    const githubResponse = await axios.get(uri, { headers });
    return res.json(githubResponse.data);
  } catch (err) {
    console.log("err");
    return res.json({ msg: "No Github Profile Found!" });
  }
});

module.exports = router;
