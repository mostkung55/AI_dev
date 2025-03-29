FROM node:lts

WORKDIR /usr/src/app

COPY /package.json ./

RUN npm install 

COPY . .

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    ln -s /usr/bin/python3 /usr/bin/python

RUN pip install --break-system-packages -r ./model/lib.txt

EXPOSE 3000

CMD [ "npm", "start" ]