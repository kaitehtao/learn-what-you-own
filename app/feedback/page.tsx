import { Header } from "../ui";
import { FeedbackClient } from "./FeedbackClient";

export default function FeedbackPage() {
  return (
    <main>
      <Header />
      <section className="feedback-hero">
        <div className="container">
          <span className="kicker">HELP SHAPE THE PRODUCT</span>
          <h1>What should owners be able to do next?</h1>
          <p>Suggest a feature, report friction, or identify a research workflow we should improve. Verified-member feedback is reviewed by @Yourhost and tracked through a clear product status.</p>
        </div>
      </section>
      <FeedbackClient />
    </main>
  );
}
