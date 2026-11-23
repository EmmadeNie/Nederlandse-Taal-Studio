// The "trial ended" e-mail, in English (for now), in Taal Studio styling.
import { escape, firstName, h1, hr, layout, mailLink, p, APP_URL } from "../_shared/mail.ts";

export const SUBJECT = "Your Taal Studio trial has ended";

type Texts = {
  title: string;
  hello: (name: string) => string;
  ended: string;
  more: string;
  contact: (docent: string, email: string) => string;
  bye: string;
};

const TEXTS: Texts[] = [
  {
    title: "Your Taal Studio trial has ended",
    hello: (name) => (name ? `Hi ${name},` : "Hi,"),
    ended: "Your Taal Studio trial has ended. With Taal Studio Free you can still look around the app.",
    more: "Would you like to continue with all lessons and exercises? You can switch to Taal Studio Compleet.",
    contact: (docent, email) =>
      `Get in touch with ${docent || "your teacher"} at ${email} for Taal Studio Compleet, or if you have questions or are interested in the app.`,
    bye: "Best wishes,",
  },
];

/** The e-mail: a white card with the text and a blue "Open Taal Studio" button. Answers go to the docent (Reply-To). */
export function mailHtml(student: string, docent: string, docentEmail: string) {
  const name = firstName(student);
  const section = (tx: Texts, i: number) => `
          ${i > 0 ? hr : ""}
          ${h1(tx.title)}
          ${p(escape(tx.hello(name)))}
          ${p(escape(tx.ended))}
          ${p(escape(tx.more))}
          ${p(tx.contact(escape(docent), mailLink(docentEmail)))}
          ${p(escape(tx.bye) + "<br>" + escape(docent || "Taal Studio"))}`;
  return layout(SUBJECT, TEXTS.map(section).join(""), { label: "Open Taal Studio", href: APP_URL });
}
