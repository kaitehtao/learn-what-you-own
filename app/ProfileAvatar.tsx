type ProfileAvatarProps = {
  name: string;
  photoUrl?: string | null;
  className: string;
};

export function ProfileAvatar({ name, photoUrl, className }: ProfileAvatarProps) {
  const label = name || "Member";
  return <span
    className={`${className}${photoUrl ? " has-photo" : ""}`}
    role={photoUrl ? "img" : undefined}
    aria-label={photoUrl ? `${label}'s profile photo` : undefined}
    style={photoUrl ? { backgroundImage: `url(${JSON.stringify(photoUrl)})` } : undefined}
  >{photoUrl ? null : label.slice(0, 1).toUpperCase()}</span>;
}
