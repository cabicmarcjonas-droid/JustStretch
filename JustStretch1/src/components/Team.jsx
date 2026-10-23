import marcImage from '../assets/team_img/Cabic.jpg'
import migsImage from '../assets/team_img/Estallo.png'
import patrickImage from '../assets/team_img/Mendoza.jpg'
import gabrielImage from '../assets/team_img/Resultay.png'
import { card } from '../lib/ui.js'

const team = [
  { name: 'Cabic, Marc Jonas', role: 'Frontend and User Interface Developer', image: marcImage },
  { name: 'Estallo, Joseph Miguel', role: 'Content Creation & Asset Management', image: migsImage },
  { name: 'Mendoza, Patrick', role: 'Computer Vision and Pose Tracking Developer', image: patrickImage },
  { name: 'Resultay, Gabriel', role: 'Pose Analysis and Backend Developer', image: gabrielImage },
]

export default function Team() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {team.map((person) => (
        <li key={person.name} className={`${card} flex items-center gap-4 p-4`}>
          <img src={person.image} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold leading-snug">{person.name}</h3>
            <p className="mt-1 text-[13px] leading-snug text-muted">{person.role}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
