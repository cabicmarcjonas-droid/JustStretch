import '../css/AboutContact.css'

import marcImage from '../assets/team_img/Cabic.jpg'
import migsImage from '../assets/team_img/Estallo.png'
import patrickImage from '../assets/team_img/Mendoza.jpg'
import gabrielImage from '../assets/team_img/Resultay.png'

const team = [
  { name: 'Cabic, Marc Jonas', role: 'Frontend and User Interface Developer', image: marcImage },
  { name: 'Estallo, Joseph Miguel', role: 'Content Creation & Asset Management', image: migsImage },
  { name: 'Mendoza, Patrick', role: 'Computer Vision and Pose Tracking Developer', image: patrickImage },
  { name: 'Resultay, Gabriel', role: 'Pose Analysis and Backend Developer', image: gabrielImage },
]

export default function Team() {
  return (
    <div className="team-members">
      <h2>Meet our Team</h2>
      <div className="team-grid">
        {team.map((person) => (
          <div className="team-card" key={person.name}>
            <img src={person.image} alt={person.name} className="team-image" />
            <h3>{person.name}</h3>
            <strong>{person.role}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
