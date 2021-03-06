# Continuous deployment of the Elm admin client.
#
# Build the image and run the container to produce 
# the compiled JS in the dist folder.
#
# Build the image:
#   cd client/elm
#   docker build -f Dockerfile -t midwife-emr-watch-admin-client .
#
# Run the container (run from the top of the Midwife-EMR project):
#   docker run --init --name=midwife-emr-watch-admin-client --rm -v $(pwd)/client/elm:/opt/src -v $(pwd)/static/js:/opt/dist midwife-emr-watch-admin-client:latest
#
# To stop the container:
#   Ctrl-C
FROM node:6.11.3 as build

WORKDIR /opt
RUN npm install elm@0.18.0 elm-test@0.18.0 \
    webpack elm-webpack-loader extract-text-webpack-plugin \
    css-loader style-loader url-loader file-loader \
    underscore socket.io

ENV PATH /opt/node_modules/.bin:$PATH

WORKDIR /opt/src
RUN ["elm", "package", "install", "-y"]

CMD ["webpack", "--watch"]

VOLUME ["/opt/src"]
VOLUME ["/opt/dist"]
