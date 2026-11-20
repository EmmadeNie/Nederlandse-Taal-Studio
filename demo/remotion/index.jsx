import { Composition, Still, registerRoot } from "remotion";
import { Demo, durationOf, FPS } from "./Demo";
import { MANIFESTS } from "./manifests";
import { Og } from "./Og";
import { Avatar } from "./Avatar";
import { StickerLogo, StickerOverview, StickerQuestion, StickerQuestionCentre, StickerQuestionLabel, StickerQuestionLight, StickerQuestionSmall, StickerLogoQr, StickerLogoQrLight, StickerIcon, StickerWordmark, StickerLogoQuestion, StickerWordmarkQuestion, StickerLogoOverview, StickerSheet, sheetSize } from "./Sticker";
import { LessonReel, lessonDuration } from "./LessonReel";
import { LESSONS, LESSON_VIDEOS } from "./lessons";
import { LessonThumb, LessonVideo } from "./LessonVideo";
import { videoDuration } from "./lessonVideoScenes";

function Root() {
  return (
    <>
      {Object.keys(MANIFESTS).flatMap((lang) => [
        // Desktop: 16:10. Phones: a taller 4:5 cut of the same video.
        <Composition key={lang} id={`demo-${lang}`} component={Demo} defaultProps={{ lang }} durationInFrames={durationOf()} fps={FPS} width={1920} height={1200} />,
        <Composition key={`${lang}-p`} id={`demo-${lang}-portrait`} component={Demo} defaultProps={{ lang }} durationInFrames={durationOf()} fps={FPS} width={1080} height={1350} />,
        // For YouTube: a normal 16:9 video and a 9:16 Short / reel.
        <Composition key={`${lang}-yt`} id={`youtube-${lang}`} component={Demo} defaultProps={{ lang }} durationInFrames={durationOf()} fps={FPS} width={1920} height={1080} />,
        <Composition key={`${lang}-reel`} id={`reel-${lang}`} component={Demo} defaultProps={{ lang }} durationInFrames={durationOf()} fps={FPS} width={1080} height={1920} />,
        // Marketing reels for socials (9:16), short: Emma, the app, proof, call to action.
        <Composition key={`${lang}-promo`} id={`promo-${lang}`} component={Demo} defaultProps={{ lang, cut: "promo" }} durationInFrames={durationOf("promo")} fps={FPS} width={1080} height={1920} />,
        <Composition key={`${lang}-quiz`} id={`promo-quiz-${lang}`} component={Demo} defaultProps={{ lang, cut: "quiz" }} durationInFrames={durationOf("quiz")} fps={FPS} width={1080} height={1920} />,
      ])}
      {/* Lesson reels (9:16): the grammar of one lesson, then a quiz. */}
      {Object.keys(LESSONS).flatMap((lesson) =>
        ["nl", "en"].map((lang) => (
          <Composition key={`${lesson}-${lang}`} id={`lesson-${lesson}-${lang}`} component={LessonReel} defaultProps={{ lesson, lang }} durationInFrames={lessonDuration(lesson)} fps={FPS} width={1080} height={1920} />
        )),
      )}
      {/* Full lesson videos (16:9) for YouTube and the grammar pages. */}
      {Object.keys(LESSON_VIDEOS).flatMap((lesson) =>
        ["nl", "en"].map((lang) => (
          <Composition key={`video-${lesson}-${lang}`} id={`lesson-video-${lesson}-${lang}`} component={LessonVideo} defaultProps={{ lesson, lang }} durationInFrames={videoDuration(lesson)} fps={FPS} width={1920} height={1080} />
        )),
      )}
      {Object.keys(LESSON_VIDEOS).flatMap((lesson) =>
        ["nl", "en"].map((lang) => <Still key={`thumb-${lesson}-${lang}`} id={`lesson-thumb-${lesson}-${lang}`} component={LessonThumb} defaultProps={{ lesson, lang }} width={1280} height={720} />),
      )}
      {/* The link preview for WhatsApp, LinkedIn & co. */}
      <Still id="og" component={Og} defaultProps={{ lang: "nl" }} width={1200} height={630} />
      {/* Profile picture for Instagram, YouTube & co. */}
      <Still id="avatar" component={Avatar} width={1080} height={1080} />
      {/* Stickers with a QR code (8×8 cm; render with --scale=3 for print) */}
      <Still id="sticker-vraag" component={StickerQuestion} width={1000} height={1000} />
      <Still id="sticker-logo" component={StickerLogo} width={1000} height={1000} />
      <Still id="sticker-vraag-a-nl" component={StickerQuestionSmall} defaultProps={{ lang: "nl" }} width={1000} height={1000} />
      <Still id="sticker-vraag-b-nl" component={StickerQuestionCentre} defaultProps={{ lang: "nl" }} width={1000} height={1000} />
      <Still id="sticker-vraag-c-nl" component={StickerQuestionLabel} defaultProps={{ lang: "nl" }} width={1000} height={1000} />
      <Still id="sticker-vraag-d-nl" component={StickerQuestionLight} defaultProps={{ lang: "nl" }} width={1000} height={1000} />
      <Still id="sticker-overzicht-nl" component={StickerOverview} defaultProps={{ lang: "nl" }} width={1940} height={1940} />
      <Still id="sticker-vraag-a-en" component={StickerQuestionSmall} defaultProps={{ lang: "en" }} width={1000} height={1000} />
      <Still id="sticker-vraag-b-en" component={StickerQuestionCentre} defaultProps={{ lang: "en" }} width={1000} height={1000} />
      <Still id="sticker-vraag-c-en" component={StickerQuestionLabel} defaultProps={{ lang: "en" }} width={1000} height={1000} />
      <Still id="sticker-vraag-d-en" component={StickerQuestionLight} defaultProps={{ lang: "en" }} width={1000} height={1000} />
      <Still id="sticker-overzicht-en" component={StickerOverview} defaultProps={{ lang: "en" }} width={1940} height={1940} />
      {/* All stickers on one print sheet (5×5 cm each; --scale=1.18 gives 300 dpi) */}
      <Still id="sticker-vel" component={StickerSheet} width={sheetSize().width} height={sheetSize().height} />
      <Still id="sticker-icoon" component={StickerIcon} width={1000} height={1000} />
      <Still id="sticker-naam" component={StickerWordmark} width={1000} height={1000} />
      <Still id="sticker-logo-e-nl" component={StickerLogoQr} defaultProps={{ lang: "nl" }} width={1000} height={1000} />
      <Still id="sticker-logo-f-nl" component={StickerLogoQrLight} defaultProps={{ lang: "nl" }} width={1000} height={1000} />
      <Still id="sticker-logo-i-nl" component={StickerLogoQuestion} defaultProps={{ lang: "nl" }} width={1000} height={1000} />
      <Still id="sticker-logo-j-nl" component={StickerWordmarkQuestion} defaultProps={{ lang: "nl" }} width={1000} height={1000} />
      <Still id="sticker-logo-overzicht-nl" component={StickerLogoOverview} defaultProps={{ lang: "nl" }} width={2880} height={1940} />
      <Still id="sticker-logo-e-en" component={StickerLogoQr} defaultProps={{ lang: "en" }} width={1000} height={1000} />
      <Still id="sticker-logo-f-en" component={StickerLogoQrLight} defaultProps={{ lang: "en" }} width={1000} height={1000} />
      <Still id="sticker-logo-i-en" component={StickerLogoQuestion} defaultProps={{ lang: "en" }} width={1000} height={1000} />
      <Still id="sticker-logo-j-en" component={StickerWordmarkQuestion} defaultProps={{ lang: "en" }} width={1000} height={1000} />
      <Still id="sticker-logo-overzicht-en" component={StickerLogoOverview} defaultProps={{ lang: "en" }} width={2880} height={1940} />
    </>
  );
}

registerRoot(Root);
