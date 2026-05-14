docker compose up --build -d

npm install @tanstack/react-query 2>&1

cd /home/admin/files/student1/frontend && HOST=0.0.0.0 npm start


cd /home/admin/files/student1/frontend && BROWSER=none HOST=0.0.0.0 npm start

C:\Windows\System32\drivers\etc inside this host folder add that 
192.168.1.14 as univ.demo.local

in server /etc/hosts also like 192.168.1.14 as univ.demo.local

In the browser also make as settings security to allow this site as http://univ.demo.local


cat /etc/nginx/conf.d/univ-demo.conf setup done this as like it
nginx/
├── nginx.conf
├── conf.d/
│   └── univ-demo.conf
├── default.d/


just run docker compose up and get access to 192.168.1.14/login
or you can open univ.demo.local only once you done setup in C:\Windows\System32\drivers\etc\host


i cahnged form univ.demo.local to university.com but its exec into the docker maybe should do some command default.d/
docker exec -it gateway-nginx cat /etc/nginx/conf.d/default.conf
once domain chanegd docker restart gateway-nginx

docker exec -it gateway-nginx nginx -t to check its ok or successful


in cmd if dns was changed do in cmd ipconfig /flushdns
Restart browser

docker compose down
docker compose build --no-cache
docker compose up -d

docker exec -it gateway-nginx sh
grep -R "univ.demo.local" /etc/nginx check dns link server name and location of the file


sudo systemctl enable --now named its active!

docker exec gateway-nginx ls /etc/nginx/ for certs


for docker compose up after running it open https://192.168.1.14/login or https://univ.demo.local/login
