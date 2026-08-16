const team = [
  {
    name: "Cabic, Marc Jonas",
    role: "lorem",
  },
  {
    name: "Estallo, Joseph Miguel",
    role: "lorem",
  },
  {
    name: "Mendoza, Patrick",
    role: "lorem",
  },
  {
    name: "Resultay, Gabriel",
    role: "lorem",
  },
];

export default function About() {
  return (
    <div className="about-page">
      <section className="about-intro">
        <h1>Just a kid with a big D</h1>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Id facere
          porro quam eos, voluptatum nisi quidem? Assumenda obcaecati mollitia
          vitae dignissimos eveniet, sapiente doloremque aspernatur adipisci
          praesentium earum nostrum exercitationem?
        </p>
      </section>

      <section className="team-members">
        <h2>Meet our Team</h2>
        <div className="team-grid">
          {team.map((person) => (
            <div className="team-card" key={person.name}>
              <h3>{person.name}</h3>
              <strong>{person.role}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
