docker compose up --build -d

npm install @tanstack/react-query 2>&1

cd /home/admin/files/student1/frontend && HOST=0.0.0.0 npm start


cd /home/admin/files/student1/frontend && BROWSER=none HOST=0.0.0.0 npm start

C:\Windows\System32\drivers\etc inside this host folder add that 
192.168.1.14 as univ.demo.local

in server /etc/hosts also like 192.168.1.14 as univ.demo.local

In the browser also make as settings security to allow this site as http://univ.demo.local


cat /etc/nginx/univ-demo.conf setup done this as like it
nginx/
├── nginx.conf
├── conf.d/
│   └── univ-demo.conf
├── default.d/


just run docker compose up and get access to 192.168.1.14/login
or you can open univ.demo.local only once you done setup in C:\Windows\System32\drivers\etc\host