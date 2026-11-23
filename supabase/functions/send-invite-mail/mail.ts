// The invitation e-mail for a prepared leerling (English, then Dutch), in Taal Studio styling.
import { cta, escape, firstName, h1, hr, layout, p } from "../_shared/mail.ts";

export const subject = (docent: string) =>
  `${docent || "Your teacher"} invited you to Taal Studio · Je bent uitgenodigd`;

type Texts = {
  title: string;
  hello: (name: string) => string;
  ready: (docent: string) => string;
  how: (email: string) => string;
  questions: string;
  bye: string;
  button: string;
};

const TEXTS: Texts[] = [
  {
    title: "Welcome to Taal Studio",
    hello: (name) => (name ? `Hi ${name},` : "Hi,"),
    ready: (docent) =>
      `${docent || "Your teacher"} has prepared a learning path for you in Taal Studio, the app for your Dutch lessons.`,
    how: (email) =>
      `Click the button and sign in with ${email}. You will get an e-mail with a login link and a code. No password needed.`,
    questions: "Questions? Just reply to this e-mail.",
    bye: "Best wishes,",
    button: "Open Taal Studio",
  },
  {
    title: "Welkom bij Taal Studio",
    hello: (name) => (name ? `Hoi ${name},` : "Hoi,"),
    ready: (docent) =>
      `${docent || "Je docent"} heeft in Taal Studio een leerpad voor je klaargezet: de app voor je lessen Nederlands.`,
    how: (email) =>
      `Klik op de knop en log in met ${email}. Je krijgt dan een e-mail met een inloglink en een code. Een wachtwoord is niet nodig.`,
    questions: "Vragen? Beantwoord gewoon deze e-mail.",
    bye: "Groetjes,",
    button: "Open Taal Studio",
  },
];

/** HTML and plain text. Answers go to the docent (Reply-To). */
export function inviteMail(student: string, studentEmail: string, docent: string, link: string) {
  const name = firstName(student);
  const sign = docent || "Taal Studio";
  const section = (tx: Texts, i: number) => `
          ${i > 0 ? hr : ""}
          ${h1(tx.title)}
          ${p(escape(tx.hello(name)))}
          ${p(escape(tx.ready(docent)))}
          ${p(escape(tx.how(studentEmail)).replace(escape(studentEmail), `<strong>${escape(studentEmail)}</strong>`))}
          ${cta(tx.button, link)}
          <div style="height:14px;"></div>
          ${p(escape(tx.questions))}
          ${p(escape(tx.bye) + "<br>" + escape(sign))}`;
  const fallback = `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#5b6372;">Button not working? / Werkt de knop niet?<br><a href="${escape(link)}" style="color:#2563eb;word-break:break-all;">${escape(link)}</a></p>`;
  const html = layout(subject(docent), TEXTS.map(section).join(""), null, fallback);

  const text = TEXTS.map((tx) =>
    [tx.title, "", tx.hello(name), "", tx.ready(docent), "", tx.how(studentEmail), "", link, "", tx.questions, "", tx.bye, sign].join("\n")
  ).join("\n\n---\n\n");
  return { html, text };
}
