-- Development seed categories. Run only in a non-production project.
insert into public.categories(name_az,slug,icon,sort_order) values
('Kamera və video','kamera-video','camera',10),
('Elektronika','elektronika','cpu',20),
('Kompüter və aksesuarlar','komputer','laptop',30),
('Alətlər və tikinti','aletler','wrench',40),
('Kempinq və outdoor','kempinq','tent',50),
('Tədbir avadanlığı','tedbir','party-popper',60),
('Təqdimat avadanlığı','teqdimat','presentation',70),
('İdman və istirahət','idman','dumbbell',80),
('Ev avadanlığı','ev','house',90),
('Digər','diger','package',100)
on conflict(slug) do update set name_az=excluded.name_az, icon=excluded.icon, sort_order=excluded.sort_order;
