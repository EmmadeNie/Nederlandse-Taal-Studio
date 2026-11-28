import { Composition, Still, registerRoot } from "remotion";
import { Demo, durationOf, FPS } from "./Demo";
import { MANIFESTS } from "./manifests";
import { Og } from "./Og";
import { Avatar } from "./Avatar";
import { StickerLogo, StickerOverview, StickerQuestion, StickerQuestionCentre, StickerQuestionLabel, StickerQuestionLight, StickerQuestionSmall, StickerLogoQr, StickerLogoQrLight, StickerIcon, StickerWordmark, StickerLogoQuestion, StickerWordmarkQuestion, StickerLogoOverview, StickerSheet, sheetSize } from "./Sticker";
import { Flyer, FlyerOverview, flyerOverviewSize, flyerSize, FLYER_VARIANTS } from "./Flyer";
import { LessonReel, lessonDuration } from "./LessonReel";
import { LESSONS, LESSON_VIDEOS } from "./lessons";
import { LessonThumb, LessonVideo } from "./LessonVideo";
import { videoDuration } from "./lessonVideoScenes";
import { CAROUSEL_SIZE, CAROUSEL_SLIDES, CarouselSlide } from "./Carousel";
import { SINTERKLAAS_SLIDES, SinterklaasSlide } from "./Sinterklaas";
import { SinterklaasStory, STORY_FPS, STORY_SIZE, storyDuration } from "./SinterklaasStory";
import { SinterklaasTeaser, TEASER_FPS, TEASER_FRAMES } from "./SinterklaasTeaser";
import { SinterklaasBloopers, BLOOPERS_FPS, bloopersDuration } from "./SinterklaasBloopers";
import { SinterklaasShort, SHORT_FPS, shortDuration } from "./SinterklaasShort";
import { SinterklaasThumb, SinterklaasVideo, SINT_VIDEO_FPS, SINT_VIDEO_SIZE, sintVideoDuration } from "./SinterklaasVideo";
import { SeparableThumb, SeparableVerbsVideo, SEP_FPS, SEP_SIZES, separableDuration } from "./SeparableVerbsVideo";
import { CON_FPS, CON_SIZE, CON_WIDE, CONTRAST_TOPICS, ContrastCover, ContrastThumb, ContrastVideo, contrastDuration } from "./ContrastVideo";

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
        <Composition key={`${lang}-intro-short`} id={`intro-short-${lang}`} component={Demo} defaultProps={{ lang, cut: "introShort" }} durationInFrames={durationOf("introShort")} fps={FPS} width={1080} height={1920} />,
        <Composition key={`${lang}-intro`} id={`intro-video-${lang}`} component={Demo} defaultProps={{ lang, cut: "intro" }} durationInFrames={durationOf("intro")} fps={FPS} width={1920} height={1080} />,
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
      {/* Instagram carousel (4:5, light): perfectum or imperfectum? One still per slide. */}
      {CAROUSEL_SLIDES.map((slide, i) => (
        <Still key={`carousel-${slide}`} id={`carousel-perfectum-imperfectum-en-${i + 1}`} component={CarouselSlide} defaultProps={{ slide, lang: "en" }} {...CAROUSEL_SIZE} />
      ))}
      {/* Instagram carousel (4:5, light): Sinterklaas in 7 words. */}
      {SINTERKLAAS_SLIDES.map((slide, i) => (
        <Still key={`sinterklaas-${slide}`} id={`carousel-sinterklaas-en-${i + 1}`} component={SinterklaasSlide} defaultProps={{ slide }} {...CAROUSEL_SIZE} />
      ))}
      {/* Instagram story (9:16): Sinterklaas in 7 words, with voice-over. */}
      <Composition id="story-sinterklaas-en" component={SinterklaasStory} durationInFrames={storyDuration()} fps={STORY_FPS} {...STORY_SIZE} calculateMetadata={({ props }) => ({ durationInFrames: storyDuration(props.timing) })} />
      {/* YouTube (16:9): Sinterklaas in 7 words, repeat after me, with the recorded voices. */}
      <Composition id="video-sinterklaas-en" component={SinterklaasVideo} durationInFrames={sintVideoDuration()} fps={SINT_VIDEO_FPS} {...SINT_VIDEO_SIZE} />
      <Still id="thumb-sinterklaas-en" component={SinterklaasThumb} width={1280} height={720} />
      <Composition id="story-sinterklaas-bloopers" component={SinterklaasBloopers} durationInFrames={bloopersDuration()} fps={BLOOPERS_FPS} width={1080} height={1920} />
      {/* YouTube Short / Reel (9:16): the funniest moment for each Sinterklaas word. */}
      <Composition id="short-sinterklaas-en" component={SinterklaasShort} durationInFrames={shortDuration()} fps={SHORT_FPS} width={1080} height={1920} />
      <Composition id="short-sinterklaas-2-en" component={SinterklaasShort} durationInFrames={shortDuration(2)} fps={SHORT_FPS} width={1080} height={1920} defaultProps={{ part: 2 }} />
      <Composition id="story-sinterklaas-teaser" component={SinterklaasTeaser} durationInFrames={TEASER_FRAMES} fps={TEASER_FPS} width={1080} height={1920} />
      {/* Separable verbs (A2) with Emma's voice: the whole lesson in 16:9 (YouTube, the lesson) and
          9:16, and a ~40 s cut with a hook for Instagram Reels and YouTube Shorts. */}
      {["nl", "en"].flatMap((lang) => [
        ...Object.entries(SEP_SIZES).map(([fmt, size]) => (
          <Composition key={`separable-${fmt}-${lang}`} id={`${fmt}-separable-${lang}`} component={SeparableVerbsVideo} defaultProps={{ lang }} durationInFrames={separableDuration()} fps={SEP_FPS} {...size} />
        )),
        <Composition key={`separable-reel-${lang}`} id={`reel-separable-${lang}`} component={SeparableVerbsVideo} defaultProps={{ lang, cut: "reel" }} durationInFrames={separableDuration("reel")} fps={SEP_FPS} {...SEP_SIZES.short} />,
        <Still key={`separable-thumb-${lang}`} id={`thumb-separable-${lang}`} component={SeparableThumb} defaultProps={{ lang }} width={1280} height={720} />,
      ])}
      {/* Which word? niet/geen, huis/thuis (EN only, music only): the lesson as a Short/Reel (9:16)
          and for YouTube (16:9), a ~25 s teaser (9:16), the teaser as an Instagram story, cover and thumbnail. */}
      {Object.keys(CONTRAST_TOPICS).flatMap((topic) => [
        <Composition key={`${topic}-short`} id={`short-${topic}-en`} component={ContrastVideo} defaultProps={{ topic }} durationInFrames={contrastDuration(topic)} fps={CON_FPS} {...CON_SIZE} />,
        <Composition key={`${topic}-wide`} id={`wide-${topic}-en`} component={ContrastVideo} defaultProps={{ topic }} durationInFrames={contrastDuration(topic)} fps={CON_FPS} {...CON_WIDE} />,
        <Composition key={`${topic}-teaser`} id={`teaser-${topic}-en`} component={ContrastVideo} defaultProps={{ topic, cut: "teaser" }} durationInFrames={contrastDuration(topic, "teaser")} fps={CON_FPS} {...CON_SIZE} />,
        <Composition key={`${topic}-story`} id={`story-${topic}-en`} component={ContrastVideo} defaultProps={{ topic, cut: "story" }} durationInFrames={contrastDuration(topic, "story")} fps={CON_FPS} {...CON_SIZE} />,
        <Still key={`${topic}-cover`} id={`cover-${topic}-en`} component={ContrastCover} defaultProps={{ topic }} {...CON_SIZE} />,
        <Still key={`${topic}-thumb`} id={`thumb-${topic}-en`} component={ContrastThumb} defaultProps={{ topic }} width={1280} height={720} />,
      ])}
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
      {/* A6 flyers, double-sided, with 3 mm bleed (111 × 154 mm; --scale=1.5 gives 381 dpi) */}
      {Object.keys(FLYER_VARIANTS).flatMap((variant) =>
        ["nl", "en"].flatMap((lang) =>
          [["front", "voor"], ["back", "achter"]].map(([side, name]) => (
            <Still key={`flyer-${variant}-${name}-${lang}`} id={`flyer-${variant}-${name}-${lang}`} component={Flyer} defaultProps={{ variant, side, lang, guides: false }} width={flyerSize().width} height={flyerSize().height} />
          )),
        ),
      )}
      <Still id="flyer-overzicht-nl" component={FlyerOverview} defaultProps={{ lang: "nl" }} width={flyerOverviewSize().width} height={flyerOverviewSize().height} />
      <Still id="flyer-overzicht-en" component={FlyerOverview} defaultProps={{ lang: "en" }} width={flyerOverviewSize().width} height={flyerOverviewSize().height} />
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
